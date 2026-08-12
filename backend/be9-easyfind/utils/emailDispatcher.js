const LostItem = require("../models/LostItem");
const Item = require("../models/FoundItem");
const EmailNotification = require("../models/EmailNotification");
const sendEmail = require("./notifications");
const { calculateMatchScore } = require("./matchingAlgorithm");
const { getLostItemMatchEmail, getLostItemMatchText } = require('./emailTemplates');
const Notification = require("../models/Notification");

/**
 * Dispatches email jobs by creating notification records
 * @param {string} type - Type of job, e.g. 'matchLostItem'
 * @param {Object} payload - Depends on job type
 */
async function dispatchEmailJob(type, payload) {
  try {
    console.log(`📨 Email queued: Queueing email job for type "${type}"`);
    
    switch (type) {
      case "matchLostItem":
        const existing = await EmailNotification.findOne({
          type: 'matchLostItem',
          relatedItem: payload.itemId,
          status: { $in: ['pending', 'processing'] },
        });

        if (!existing) {
          await EmailNotification.create({
            type: 'matchLostItem',
            relatedItem: payload.itemId,
            status: 'pending',
          });
          console.log(`📨 Email queued: Notification job created for found item: ${payload.itemId}`);
        } else {
          console.log(`⏭️ Email queued: Notification job already exists/pending for found item: ${payload.itemId}`);
        }
        break;

      case "customEmail":
        await EmailNotification.create({
          type: 'customEmail',
          recipientEmail: payload.to,
          subject: payload.subject,
          body: payload.body,
          status: 'pending',
        });
        console.log(`📨 Email queued: Custom email notification created for recipient: ${payload.to}`);
        break;

      default:
        console.warn("⚠️ Unknown email job type:", type);
    }

    // Trigger immediate processing of queued notifications asynchronously
    setImmediate(async () => {
      try {
        console.log("⚡ Running processPendingNotifications immediately...");
        await processPendingNotifications();
      } catch (err) {
        console.error("Error processing pending notifications immediately:", err);
      }
    });

  } catch (err) {
    console.error("❌ Database errors: Failed to queue email notification:", err);
  }
}

/**
 * Processes pending notifications and sends emails
 * Called by the scheduler
 */
async function processPendingNotifications() {
  try {
    const pendingNotifications = await EmailNotification.find({
      status: 'pending',
      attempts: { $lt: 3 },
    }).limit(50); // Process in batches

    if (pendingNotifications.length > 0) {
      console.log(`📬 Processing ${pendingNotifications.length} pending notifications...`);
    }

    for (const notification of pendingNotifications) {
      // Mark as processing to avoid duplicate processing
      notification.status = 'processing';
      notification.lastAttempt = new Date();
      notification.attempts += 1;
      
      try {
        await notification.save();
      } catch (dbErr) {
        console.error("❌ Database errors: Failed to update notification status to processing:", dbErr);
        continue;
      }

      try {
        if (notification.type === 'matchLostItem') {
          await processMatchNotification(notification);
        } else if (notification.type === 'customEmail') {
          console.log(`📤 Email sending: Sending custom email to: ${notification.recipientEmail}`);
          
          try {
            await sendEmail(
              notification.recipientEmail,
              notification.subject,
              notification.body
            );
            
            notification.status = 'completed';
            notification.emailsSent = 1;
            notification.processedAt = new Date();
            await notification.save();
            console.log(`✅ Email sent: Custom email successfully sent to: ${notification.recipientEmail}`);
          } catch (smtpErr) {
            console.error(`❌ SMTP errors: Failed to send custom email to ${notification.recipientEmail}:`, smtpErr.message);
            throw smtpErr; // Rethrow to trigger retry logic
          }
        }
      } catch (err) {
        notification.error = err.message;
        if (notification.attempts >= 3) {
          notification.status = 'failed';
          console.error(`❌ Email failed: Notification ${notification._id} failed after maximum attempts.`);
        } else {
          notification.status = 'pending'; // Retry on next run
          console.log(`🔄 Email failed: Notification ${notification._id} will be retried (Attempt ${notification.attempts}/3)`);
        }
        
        try {
          await notification.save();
        } catch (dbErr) {
          console.error("❌ Database errors: Failed to save notification failure state:", dbErr);
        }
      }
    }
  } catch (err) {
    console.error('❌ Database errors: Error processing notifications:', err);
  }
}

/**
 * Process match notification - find recipients using weighted confidence scores and send emails
 * @param {Object} notification - EmailNotification document
 */
async function processMatchNotification(notification) {
  let item;
  try {
    item = await Item.findById(notification.relatedItem);
  } catch (dbErr) {
    console.error("❌ Database errors: Failed to fetch found item from database:", dbErr);
    throw dbErr;
  }

  if (!item) {
    throw new Error(`Item not found for ID: ${notification.relatedItem}`);
  }

  let lostItems;
  try {
    lostItems = await LostItem.find({});
  } catch (dbErr) {
    console.error("❌ Database errors: Failed to fetch lost items from database:", dbErr);
    throw dbErr;
  }

  let emailsSent = 0;
  const matches = [];
  const threshold = parseInt(process.env.MATCHING_THRESHOLD) || 50;

  console.log(`🔍 Matching check: Processing item "${item.itemName}" (ID: ${item._id}) against ${lostItems.length} lost items. Threshold: ${threshold}%`);

  for (const lostItem of lostItems) {
    try {
      const score = calculateMatchScore(lostItem, item);

      if (score >= threshold) {
        console.log(`🎯 Match detected: Found Item "${item.itemName}" matches Lost Item "${lostItem.itemName}" reported by ${lostItem.email} with Confidence Score: ${score}% (Threshold: ${threshold}%)`);

        // Update LostItem status in database
        if (lostItem.status !== 'claimed') {
          lostItem.status = 'match-found';
          await lostItem.save();
        }

        // Record the match in memory to store in the notification document later
        matches.push({
          lostItem: lostItem._id,
          email: lostItem.email,
          confidenceScore: score
        });

        // Trigger In-App Notification for potential match
        await Notification.create({
          email: lostItem.email.toLowerCase(),
          title: "Potential Match Found",
          description: `A found item "${item.itemName}" matches your reported lost item "${lostItem.itemName}" with ${score}% confidence.`,
          type: "warning",
          icon: "Sparkles",
          relatedItem: item._id
        });

        // Generate HTML email from template
        const { subject, html } = getLostItemMatchEmail(lostItem, item);
        
        console.log(`📤 Email sending: Sending match notification to: ${lostItem.email}`);
        
        try {
          await sendEmail(
            lostItem.email,
            subject,
            html,
            true // Set isHTML flag to true
          );
          emailsSent++;
          console.log(`✅ Email sent: Successfully notified ${lostItem.email}`);
        } catch (smtpErr) {
          console.error(`❌ SMTP errors: Failed to send match email to ${lostItem.email}:`, smtpErr.message);
          // Don't abort the entire loop; try to notify other potential matches
        }
      }
    } catch (err) {
      console.error(`❌ Error matching lost item ${lostItem._id} to found item ${item._id}:`, err);
    }
  }

  // Save the matches and mark as completed
  notification.status = 'completed';
  notification.emailsSent = emailsSent;
  notification.matches = matches;
  notification.processedAt = new Date();
  
  try {
    await notification.save();
    console.log(`✅ Processed item ${item._id}: ${emailsSent} email(s) sent out of ${matches.length} matches detected`);
  } catch (dbErr) {
    console.error("❌ Database errors: Failed to save completed notification matches:", dbErr);
    throw dbErr;
  }
}

module.exports = { 
  dispatchEmailJob, 
  processPendingNotifications 
};
