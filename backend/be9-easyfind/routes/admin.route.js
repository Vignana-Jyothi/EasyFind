const express = require('express');
const router = express.Router();
router.use(express.json());
const LostItem = require('../models/LostItem');
const Item = require('../models/FoundItem');
const { upload, cloudinary } = require('../config/cloudinary')
const  auth =require('../middlewares/admin-auth')
const sendEmail = require("../utils/notifications");
const stringSimilarity = require("string-similarity");
const { dispatchEmailJob } = require('../utils/emailDispatcher');
const User = require('../models/User');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');
const Notification = require('../models/Notification');

  /////////////////////////////////////////////// ADMIN ROUTES///////////////////////////
  // admin login
  // routes/adminAuth.js
// const express = require('express');
// const router = express.Router();


const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



// Function to generate a random 4-character alphanumeric code
function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Function to ensure the code is unique
async function generateUniqueCode() {
  let code;
  let exists = true;
  while (exists) {
      code = generateCode();
      exists = await Item.exists({ code });
  }
  return code;
}




// POST /api/admin/login
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     // Find the admin by username
//     const admin = await Admin.findOne({ username });

//     console.log("username:",admin)

//     if (!admin) {
//       return res.status(400).json({ msg: 'Invalid credentials' });
//     }


//     bcrypt.hash("password123", 10).then(hash => console.log(hash));


//     // Compare the entered password with the stored hashed password
//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       return res.status(400).json({ msg: 'password is incorrect' });
//     }

//     // Create a JWT payload
//     const payload = { admin: { id: admin._id } };

//     // Sign the JWT token
//     jwt.sign(
//       payload,
//       process.env.JWT_SECRET, // ensure this is defined in your environment
//       { expiresIn: '24h' },
//       (err, token) => {
//         if (err) throw err;
//         console.log("login successful")
        
//         res.json({ token });
//       }
//     );
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });
// // checking if the token is valid or not
// router.get('/verify', auth, (req, res) => {
//   res.json({ message: 'Token is valid', user: req.user });
// });
// // change password route for admin

// router.post("/change-password", auth, async (req, res) => {
//   try {
//     const { oldPassword, newPassword } = req.body;

//     if (!oldPassword || !newPassword) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const user = await Admin.findById(req.user);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!bcrypt.compareSync(oldPassword, user.password)) {
//       return res.status(400).json({ message: "Incorrect old password" });
//     }

//     user.password = bcrypt.hashSync(newPassword, 10);
//     await user.save();

//     res.status(200).json({ message: "Password changed successfully" });
//   } catch (error) {
//     console.error("Error changing password:", error);
//     res.status(500).json({ message: "Server error" ,error:error });
//   }
// });



// admin found

router.get('/found', auth, async (req, res) => {
  try {
    const foundItems = await Item.find();
    return res.status(200).json(foundItems || []);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


  // admin upload
  // const stringSimilarity = require("string-similarity");

  router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Image required' });
  
      const { itemName, description, foundLocation, category, reportedDate } = req.body;
      if (!itemName || !description || !foundLocation || !category) 
        return res.status(400).json({ success: false, message: 'All fields are required' });
  
      const newItem = await Item.create({
        itemName,
        description,
        foundLocation,
        category,
        handoverLocation: 'Security Office',
        status: 'verified', // Admin uploads directly as verified
        code: await generateUniqueCode(),
        reportedDate,
        image: { url: req.file.path, public_id: req.file.filename }
      });

      // send email by calling email dispatcher
      dispatchEmailJob("matchLostItem",{itemId:newItem._id});
      res.json(newItem);
  
      
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  

// handover items
router.put("/:id/handover",auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Proof image required" });

    const { id } = req.params;
    const { contact, rollNo, name } = req.body;

    if (!contact || !rollNo || !name) {
      return res.status(400).json({ success: false, message: "All fields (contact, rollNo, name) are required" });
    }

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // Update status and store Cloudinary image details
    item.status = "claimed";
    item.claimerDetails = {
      contact,
      rollNo,
      name,
      proofs: [
        ...(item.claimerDetails?.proofs || []),
        { url: req.file.path, public_id: req.file.filename }
      ]
    };

    await item.save();
    console.log("Item handed over successfully with item details", item);

    // Trigger In-App Notifications
    const studentEmail = rollNo.toLowerCase() + "@vnrvjiet.in";
    await Notification.create({
      email: studentEmail,
      title: "Item Handed Over",
      description: `Your item "${item.itemName}" (Code: ${item.code}) has been successfully claimed and handed over to you.`,
      type: "success",
      icon: "Gift",
      relatedItem: item._id
    });

    // Trigger Email Notification
    await sendEmail(
      studentEmail,
      "Item Handed Over - EasyFind",
      `Your item "${item.itemName}" (Unique Code: ${item.code}) has been successfully claimed and handed over to you.`
    ).catch(err => console.error("Failed to send handover email:", err));

    await Notification.create({
      email: "admin",
      title: "Handover Confirmed",
      description: `Item "${item.itemName}" (Code: ${item.code}) was handed over to student ${rollNo.toUpperCase()} manually.`,
      type: "success",
      icon: "Gift",
      relatedItem: item._id
    });

    res.json({ success: true, message: "Item handed over successfully", item });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});



// Route to update item status and send the notification
// const stringSimilarity = require("string-similarity");


router.patch("/updatestatus", auth, async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "Item ID and status are required" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.status === "claimed" && status === "pending") {
      return res.status(400).json({ message: "Cannot change claimed item back to pending" });
    }

    await Item.updateOne({ _id: id }, { $set: { status } });

    // Trigger In-App Notifications
    if (status === "verified") {
      if (item.reporterRollNo && item.reporterRollNo !== "admin") {
        const studentEmail = item.reporterRollNo.toLowerCase() + "@vnrvjiet.in";
        await Notification.create({
          email: studentEmail,
          title: "Report Verified",
          description: `Your reported found item "${item.itemName}" has been verified by the Security Office.`,
          type: "success",
          icon: "ShieldCheck",
          relatedItem: item._id
        });

        // Trigger Email Notification
        await sendEmail(
          studentEmail,
          "Found Report Verified - EasyFind",
          `Your reported found item "${item.itemName}" has been verified by the Security Office. Thank you for contributing to campus safety.`
        ).catch(err => console.error("Failed to send verification email:", err));
      }
    }

    // If the item is verified, compare with all lost items
    if (status === "verified" && item.description) {
      dispatchEmailJob("matchLostItem",{itemId:item._id});
    }

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


////////////////// edit the documents ex:deleting,...

// Update Found Item (Admin Route)
router.put('/edit-item/:id', async (req, res) => {
  try {
      const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });

      if (!updatedItem) {
          return res.status(404).json({ message: 'Item not found' });
      }

      res.status(200).json(updatedItem);
  } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Found Item (Admin Route)
router.delete('/edit-item/:id', async (req, res) => {
  try {
      const deletedItem = await Item.findByIdAndDelete(req.params.id);

      if (!deletedItem) {
          return res.status(404).json({ message: 'Item not found' });
      }

      res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Example usage in your route (around line 244)
// When verifying/approving an item:
router.patch('/verify/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Queue email notifications
    await dispatchEmailJob('matchLostItem', { itemId: item._id });

    res.json({ 
      message: 'Item verified successfully',
      item 
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Barcode Handover Verification Endpoint
router.post('/:id/verify-handover', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { barcodeValue, rollNo } = req.body;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Found item not found' });
    }

    if (item.status === 'claimed') {
      return res.status(400).json({ success: false, message: 'Item has already been handed over/claimed.' });
    }

    let rollNoInput = (barcodeValue || rollNo || "").trim().toLowerCase();
    if (!rollNoInput) {
      return res.status(400).json({ success: false, message: 'Roll number or barcode is required' });
    }

    console.log(`[Handover Verification] Verifying roll number: ${rollNoInput.toUpperCase()} for item: ${item.itemName} (${item._id})`);

    // Search for lost items from this student
    const studentLostItems = await LostItem.find({
      email: { $regex: new RegExp("^" + rollNoInput + "@", "i") }
    });

    if (!studentLostItems || studentLostItems.length === 0) {
      console.warn(`[Handover Verification] Failed: No lost item reports found for student ${rollNoInput.toUpperCase()}`);
      return res.status(400).json({
        success: false,
        message: `Verification failed. Student ${rollNoInput.toUpperCase()} does not have any lost item reports.`
      });
    }

    const threshold = parseInt(process.env.MATCHING_THRESHOLD) || 50;
    let bestMatch = null;
    let highestScore = -1;

    for (const lostItem of studentLostItems) {
      const score = calculateMatchScore(lostItem, item);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = lostItem;
      }
    }

    if (highestScore < threshold) {
      console.warn(`[Handover Verification] Failed: Match score (${highestScore}%) below threshold (${threshold}%) for student ${rollNoInput.toUpperCase()}`);
      return res.status(400).json({
        success: false,
        message: `Verification failed. Confidence score (${highestScore}%) is below the required threshold of ${threshold}%.`
      });
    }

    // Try to find the student's name from Userstemp database
    const studentUser = await User.findOne({
      email: { $regex: new RegExp("^" + rollNoInput + "@", "i") }
    });
    const studentName = studentUser ? studentUser.name : "Student";

    console.log(`[Handover Verification] Success: Verified owner ${studentName} (${rollNoInput.toUpperCase()}) with score ${highestScore}%`);

    return res.json({
      success: true,
      message: 'Verification Success',
      student: {
        rollNo: rollNoInput.toUpperCase(),
        name: studentName,
        email: bestMatch.email
      },
      matchedItem: {
        itemName: bestMatch.itemName,
        category: bestMatch.category,
        description: bestMatch.description,
        score: highestScore
      }
    });
  } catch (error) {
    console.error('[Handover Verification] Database/Server Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during verification' });
  }
});

// Barcode Handover Confirmation Endpoint
router.post('/:id/confirm-handover', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { barcodeValue, rollNo, name, contact, isManual } = req.body;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Found item not found' });
    }

    if (item.status === 'claimed') {
      return res.status(400).json({ success: false, message: 'Item has already been handed over/claimed.' });
    }

    if (!rollNo) {
      return res.status(400).json({ success: false, message: 'Student roll number is required' });
    }

    const adminEmail = req.admin ? req.admin.email : 'admin';

    // Update FoundItem status and store handover details
    item.status = 'claimed';
    item.handoverDetails = {
      handoverTime: new Date(),
      handoverAdmin: adminEmail,
      studentRollNumber: rollNo.toUpperCase(),
      barcodeValue: barcodeValue || 'Manual Entry',
      isManual: !!isManual
    };

    // Also populate claimerDetails for backward compatibility
    item.claimerDetails = {
      name: name || 'Student',
      rollNo: rollNo.toUpperCase(),
      contact: contact || 'N/A',
      dateHandovered: new Date(),
      proofs: []
    };

    await item.save();
    console.log(`[Handover Confirmed] Item ID ${item._id} successfully handed over to ${rollNo.toUpperCase()} by admin ${adminEmail}`);

    // Trigger In-App Notifications
    const studentEmail = rollNo.toLowerCase() + "@vnrvjiet.in";
    await Notification.create({
      email: studentEmail,
      title: "Item Handed Over",
      description: `Your item "${item.itemName}" (Code: ${item.code}) has been securely handed over to you.`,
      type: "success",
      icon: "Gift",
      relatedItem: item._id
    });

    // Trigger Email Notification
    await sendEmail(
      studentEmail,
      "Item Handed Over - EasyFind",
      `Your item "${item.itemName}" (Unique Code: ${item.code}) has been securely claimed and handed over to you by the Security Office.`
    ).catch(err => console.error("Failed to send handover email:", err));

    await Notification.create({
      email: "admin",
      title: "Secure Handover Completed",
      description: `Item "${item.itemName}" (Code: ${item.code}) successfully handed over to student ${rollNo.toUpperCase()} via barcode scan.`,
      type: "success",
      icon: "Gift",
      relatedItem: item._id
    });

    return res.json({
      success: true,
      message: 'Item handed over successfully',
      item
    });
  } catch (error) {
    console.error('[Handover Confirmation] Database/Server Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during handover confirmation' });
  }
});

module.exports = router;




