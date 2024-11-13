const { MongoClient, ObjectId } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'profil';

async function main() {
  await client.connect();
  console.log('Connexion établie avec MongoDB');

  const db = client.db(dbName);

  // Création des collections si elles n'existent pas
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(col => col.name);

  if (!collectionNames.includes('profil')) {
    await db.createCollection('profil');
    console.log('Collection profil créée');
  }

  if (!collectionNames.includes('compétences')) {
    await db.createCollection('compétences');
    console.log('Collection compétences créée');
  }

  if (!collectionNames.includes('objet')) {
    await db.createCollection('objet');
    console.log('Collection objet créée');
  }

  if (!collectionNames.includes('statistiques_joueur')) {
    await db.createCollection('statistiques_joueur');
    console.log('Collection statistiques_joueur créée');
  }

  // Collection principale pour les statistiques et profils
  const statistiquesCollection = db.collection('statistiques_joueur');
  const profilCollection = db.collection('profil');
  const competencesCollection = db.collection('compétences');
  const objetCollection = db.collection('objet');
  await createIndexes();
  // Fonction Create Profil
  async function createProfil(pseudo, classe, niveau) {
    const profil = {
      pseudo: pseudo,
      classe: classe,
      niveau: niveau,
      compétences: [], // Liste d'IDs de compétences
      inventaire: [] // Liste d'objets
    };
    const result = await profilCollection.insertOne(profil);
    console.log(`Profil créé avec ID : ${result.insertedId}`);
  }

  // Fonction pour trouver un profil par pseudo
  async function findProfilByPseudo(pseudo) {
    const profil = await profilCollection.findOne({ pseudo });
    if (profil) {
      console.log(`Profil trouvé:`, profil);
    } else {
      console.log(`Aucun profil trouvé avec le pseudo: ${pseudo}`);
    }
    return profil;
  }
  async function updateProfil(pseudo, updateData) {
    const result = await profilCollection.updateOne(
      { pseudo: pseudo },
      { $set: updateData }
    );
    console.log(`${result.modifiedCount} document(s) mis à jour pour le pseudo ${pseudo}`);
  }

  // Fonction pour ajouter un objet au profil
  async function ajouterObjetAuProfil(pseudo, nomObjet, quantite) {
    const objet = { nom: nomObjet };
    const objetResult = await objetCollection.insertOne(objet);
    const objetId = objetResult.insertedId;

    // Ajout de l'objet dans le champ "inventaire" du profil
    const profil = await findProfilByPseudo(pseudo);
    if (profil) {
      await profilCollection.updateOne(
        { _id: profil._id },
        { $push: { inventaire: { objet_id: objetId, nom: nomObjet, quantite: quantite } } }
      );
      console.log(`Objet ajouté dans le profil ${pseudo}`);
    }
  }

  // Fonction pour ajouter une compétence au profil
  async function ajouterCompetenceAuProfil(pseudo, nomCompetence, niveau) {
    // Création de la compétence dans la collection "compétences"
    const competence = { nom: nomCompetence, niveau: niveau };
    const competenceResult = await competencesCollection.insertOne(competence);
    const competenceId = competenceResult.insertedId;

    // Ajout de la référence de compétence dans le champ "compétences" du profil
    const profil = await findProfilByPseudo(pseudo);
    if (profil) {
      await profilCollection.updateOne(
        { _id: profil._id },
        { $push: { compétences: competenceId } } // Ajout de l'ID de la compétence
      );
      console.log(`Compétence ajoutée au profil ${pseudo}`);
    }
  }

  // Fonction Create Statistique
  async function createStatistique(player_id, type_action, xp) {
    const statistique = {
      player_id: new ObjectId(player_id),
      type_action: type_action,
      xp: xp,
      timestamp: new Date()
    };
    const result = await statistiquesCollection.insertOne(statistique);
    console.log(`Statistique créée avec ID : ${result.insertedId}`);
  }

  // Fonction Read Statistiques
  async function readStatistiques(player_id) {
    const result = await statistiquesCollection.find({ player_id: new ObjectId(player_id) }).toArray();
    console.log('Statistiques trouvées:', result);
  }

  // Fonction Update Statistique
  async function updateStatistique(player_id, new_xp) {
    const result = await statistiquesCollection.updateOne(
      { player_id: new ObjectId(player_id) },
      { $set: { xp: new_xp } }
    );
    console.log(`${result.modifiedCount} document(s) mis à jour`);
  }

  // Fonction Delete Statistique
  async function deleteStatistique(player_id) {
    const result = await statistiquesCollection.deleteOne({ player_id: new ObjectId(player_id) });
    console.log(`${result.deletedCount} document(s) supprimé(s)`);
  }

  // Ajouter un nombre aléatoire de compétences (moins de 10) et d'objets (moins de 20)
  async function ajouterCompetencesEtObjets(pseudo) {
    const compétences = [
      "Sort de feu", "Téléportation", "Bouclier magique", "Coup de bouclier", "Éclair magique",
      "Invocation", "Soin", "Invisibilité", "Choc terrestre", "Flamme éternelle"
    ];

    const objets = [
      "Potion de santé", "Épée magique", "Bouclier de force", "Arc enchanté", "Élixir de mana",
      "Pierre de résurrection", "Casque enchanté", "Gants de force", "Anneau magique", "Bottes de vitesse",
      "Épée légendaire", "Cloak of Shadows", "Potion de régénération", "Hache d'impact", "Lance de glace",
      "Cape d'invisibilité", "Potion de protection", "Clé mystique", "Amulette magique", "Bâton de mage"
    ];

    // Nombre aléatoire de compétences (entre 1 et 9)
    const nbCompetences = Math.floor(Math.random() * 9) + 1;
    for (let i = 0; i < nbCompetences; i++) {
      const niveau = Math.floor(Math.random() * 10) + 1; // Niveau aléatoire entre 1 et 10
      await ajouterCompetenceAuProfil(pseudo, compétences[i], niveau);
    }

    // Nombre aléatoire d'objets (entre 1 et 19)
    const nbObjets = Math.floor(Math.random() * 19) + 1;
    for (let i = 0; i < nbObjets; i++) {
      const quantite = Math.floor(Math.random() * 5) + 1; // Quantité aléatoire entre 1 et 5
      await ajouterObjetAuProfil(pseudo, objets[i], quantite);
    }
  }

  async function createIndexes() {
    await profilCollection.createIndex({ pseudo: 1 });
    await statistiquesCollection.createIndex({ player_id: 1 });
    console.log('Indexes created.');
  }

  async function statistiquesCompetences() {
    const result = await profilCollection.aggregate([
      { $unwind: "$compétences" },
      {
        $lookup: {
          from: "compétences",
          localField: "compétences",
          foreignField: "_id",
          as: "competences_details"
        }
      },
      { $unwind: "$competences_details" },
      {
        $group: {
          _id: "$competences_details.nom",
          nombreJoueurs: { $sum: 1 },
          niveauMoyen: { $avg: "$competences_details.niveau" }
        }
      },
      { $sort: { nombreJoueurs: -1 } }
    ]).toArray();

    console.log("Statistiques des compétences:", result);

    // Insérer les résultats dans une nouvelle collection
    const statsCollection = db.collection('competences_stats');
    await statsCollection.insertMany(result);
    console.log('Statistiques des compétences insérées dans la collection competences_stats');
    //si vous voulez réaliser l'aggregation depuis mongodb, voici la pipeline:
    // [
    //   { $unwind: "$compétences" },
    //   {
    //     $lookup: {
    //       from: "compétences",
    //       localField: "compétences",
    //       foreignField: "_id",
    //       as: "competences_details"
    //     }
    //   },
    //   { $unwind: "$competences_details" },
    //   {
    //     $group: {
    //       _id: "$competences_details.nom",
    //       nombreJoueurs: { $sum: 1 },
    //       niveauMoyen: { $avg: "$competences_details.niveau" }
    //     }
    //   },
    //   { $sort: { nombreJoueurs: -1 } }
    // ]
  }

  //voici le code executé
  try {
    // Création de profils
    await createProfil("tata", "Wizard", 10);
    await createProfil("toto", "Guerrier", 12);

    // Ajouter un nombre aléatoire de compétences et d'objets
    await ajouterCompetencesEtObjets("tata");
    await ajouterCompetencesEtObjets("toto");

    // Création de statistiques pour "tata" et "toto"
    const tataProfil = await findProfilByPseudo("tata");
    await createStatistique(tataProfil._id, "attaque", 150);
    await createStatistique(tataProfil._id, "défense", 80);

    const totoProfil = await findProfilByPseudo("toto");
    await createStatistique(totoProfil._id, "attaque", 200);
    await createStatistique(totoProfil._id, "défense", 90);

    // afficher les profils
    const tataFinal = await findProfilByPseudo("tata");
    console.log(`Profil final de tata:`, tataFinal);

    const totoFinal = await findProfilByPseudo("toto");
    console.log(`Profil final de toto:`, totoFinal);

    // Lire les statistiques spécifiques
    await readStatistiques(tataProfil._id, "attaque");
    await readStatistiques(tataProfil._id, "défense");
    await readStatistiques(totoProfil._id, "attaque");
    await readStatistiques(totoProfil._id, "défense");

    // Mettre à jour les profils
    await updateProfil("tata", { niveau: 11 });
    await updateProfil("toto", { niveau: 13 });

    // Ajouter des objets et des compétences aux profils
    await ajouterObjetAuProfil("tata", "Épée légendaire", 1);
    await ajouterCompetenceAuProfil("toto", "Sort de feu", 5);

    // Mettre à jour une statistique
    await updateStatistique(tataProfil._id, 170);
    await updateStatistique(totoProfil._id, 210);

    // Supprimer une statistique
    await deleteStatistique(tataProfil._id);
    await deleteStatistique(totoProfil._id);

    // Effectuer des agrégations de statistiques de compétences
    await statistiquesCompetences();

  } finally {
    await client.close();
  }
}

main().catch(console.error);
