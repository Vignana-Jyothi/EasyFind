### Branching approach
Overall we have 3 branches
 - main
 - qa
 - development branches : explained as below. 


We are following a **trunk-based development** model **without a shared `dev` branch**. Instead, each **team owns its own main development branch**, and they promote stable features directly to `qa`.  

---

### **🚀 Your Revised Workflow**
Each team works on **their own team-specific branches**, with additional **sub-branches** if needed.

#### **1. Branch Structure Example (No Shared `dev`)**
```
📂 vj-projects-test/
│── 📂 backend/
│   ├── 📂 be1-complaints/  (Owned by Team 1)
│   ├── 📂 be2-dpd/         (Owned by Team 2)
│   ├── 📂 be3/             (Owned by Team 3)
│── 📂 frontend/
│   ├── 📂 fe1-complaints/  (Owned by Team 1)
│   ├── 📂 fe2-superapp/    (Owned by Team 2)
│   ├── 📂 fe3-app-one/     (Owned by Team 3)
```

#### **2. Each Team Has Its Own Main Development Branch**
For example:
- **Team 1 works on `team1-main`**  
- **Team 2 works on `team2-main`**  
- **Team 3 works on `team3-main`**  
- If they do experiments, they create sub-branches like `team1-featureX`, `team2-refactorY`, etc.

---

### **🚀 Development Workflow**
#### **(1) Developers Work in Their Team Branches**
Each team commits and pushes code into **their team’s branch**. If a feature requires more work, they create **sub-branches**.

Example:
```bash
git checkout -b team1-feature1
git commit -m "Adding feature1 for Team1"
git push origin team1-feature1
```

#### **(2) Promote Only Stable Code to `qa`**
Once a team’s feature is **fully tested**, they merge **only that stable feature** to `qa`. If another feature is still under testing, it stays in the team's branch.

```bash
git checkout qa
git merge team1-feature1
git push origin qa
```
✅ **This prevents unstable code from moving forward!**

#### **(3) Merge to `main` Only After Full Testing in `qa`**
Once everything in `qa` is verified, only the stable and tested parts go into `main`:
```bash
git checkout main
git merge qa
git push origin main
```
🚀 Now, `main` is always production-ready!

---

### **✅ Benefits of This Approach**
1. **No shared `dev` branch → No risk of unstable code affecting other teams.**  
2. **Teams own their features → Better isolation & control.**  
3. **Only stable features move forward → No half-baked code in `qa` or `main`.**  
4. **Parallel work in sub-branches → Experiments can run without blocking releases.**  
5. **No unnecessary merges → Each merge is deliberate and tested.**  

---
