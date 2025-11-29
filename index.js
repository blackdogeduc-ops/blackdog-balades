// Firebase Cloud Functions pour Black Dog Balades
// Matching automatique des groupes + suggestion de ville (Niort en cas d'égalité)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 1 = Chiot, 2 = Polyvalent, 3 = Agressif, 4 = Peureux, 5 = Harceleur
function areCompatible(p1, p2) {
  if (p1 === 2 || p2 === 2) return true;

  if (p1 === 1 && (p2 === 3 || p2 === 5)) return false;
  if (p2 === 1 && (p1 === 3 || p1 === 5)) return false;

  if (p1 === 3 || p2 === 3) return false;

  if ((p1 === 4 && p2 === 5) || (p2 === 4 && p1 === 5)) return false;

  return true;
}

function isCompatibleWithGroup(dog, group) {
  return group.every(other => areCompatible(dog.profileCode, other.profileCode));
}

function suggestCity(groupDogs) {
  const counts = {};
  groupDogs.forEach(dog => {
    const city = dog.city || "";
    if (!city) return;
    counts[city] = (counts[city] || 0) + 1;
  });

  const entries = Object.entries(counts);
  if (entries.length === 0) return "Niort";

  entries.sort((a, b) => b[1] - a[1]);
  const topCount = entries[0][1];
  const topCities = entries.filter(e => e[1] === topCount).map(e => e[0]);

  if (topCities.length === 1) return topCities[0];
  return "Niort";
}

function createGroupsForSlot(dogs) {
  const groups = [];

  for (const dog of dogs) {
    let placed = false;

    for (const group of groups) {
      if (isCompatibleWithGroup(dog, group.dogs)) {
        group.dogs.push(dog);
        group.citySuggested = suggestCity(group.dogs);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push({
        dogs: [dog],
        citySuggested: dog.city || "Niort"
      });
    }
  }

  return groups;
}

// Fonction planifiée (par exemple toutes les heures)
exports.matchSlots = functions.pubsub.schedule("0 * * * *").onRun(async (context) => {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  const slotsSnap = await db.collection("slots")
    .where("locked", "==", false)
    .where("date", ">=", todayISO)
    .get();

  const slots = [];
  slotsSnap.forEach(doc => slots.push({ id: doc.id, ...doc.data() }));

  const byKey = {};
  for (const slot of slots) {
    const key = `${slot.date}|${slot.timeSlot}`;
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(slot);
  }

  for (const key of Object.keys(byKey)) {
    const [date, timeSlot] = key.split("|");
    const slotsForThis = byKey[key];

    const dogIds = Array.from(new Set(slotsForThis.map(s => s.dogId)));
    if (!dogIds.length) continue;

    const dogDocs = [];
    const batches = [];
    while (dogIds.length) {
      batches.push(dogIds.splice(0, 10));
    }
    for (const batchIds of batches) {
      const snap = await db.collection("dogs")
        .where(admin.firestore.FieldPath.documentId(), "in", batchIds)
        .get();
      snap.forEach(doc => dogDocs.push({ id: doc.id, ...doc.data() }));
    }

    const groups = createGroupsForSlot(dogDocs);

    const groupBatch = db.batch();
    for (const group of groups) {
      const ref = db.collection("groups").doc();
      groupBatch.set(ref, {
        date,
        timeSlot,
        citySuggested: group.citySuggested,
        membersIds: group.dogs.map(d => d.ownerId),
        dogsIds: group.dogs.map(d => d.id),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "active"
      });
    }

    const slotBatch = db.batch();
    for (const slot of slotsForThis) {
      const ref = db.collection("slots").doc(slot.id);
      slotBatch.update(ref, { locked: true });
    }

    await groupBatch.commit();
    await slotBatch.commit();
  }

  return null;
});
