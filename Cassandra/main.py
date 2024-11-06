import sqlite3
from datetime import datetime
import random

# Connexion à la base de données
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Création de la table si elle n'existe pas
cursor.execute('''
    CREATE TABLE IF NOT EXISTS statistiques_joueur (
        id INT PRIMARY KEY,
        attack INT,
        defense INT,
        vitesse INT,
        created_at TIMESTAMP
    );
''')
conn.commit()

def create_statistiques_joueur(attack, defense, vitesse, created_at=None):
    # Récupère le dernier id et incrémente
    cursor.execute('SELECT MAX(id) FROM statistiques_joueur')
    last_id = cursor.fetchone()[0]
    new_id = (last_id + 1) if last_id is not None else 1  # Incrémente ou démarre à 1

    # Utilise la date actuelle si non précisé
    created_at = created_at or datetime.utcnow().isoformat()

    # Insère les données dans la table
    query = '''
        INSERT INTO statistiques_joueur (id, attack, defense, vitesse, created_at)
        VALUES (?, ?, ?, ?, ?);
    '''
    cursor.execute(query, (new_id, attack, defense, vitesse, created_at))
    conn.commit()
    print(f"Nouveau joueur avec id {new_id} ajouté avec succès.")

def read_statistiques_joueur():
    query = 'SELECT * FROM statistiques_joueur;'
    cursor.execute(query)
    results = cursor.fetchall()
    for row in results:
        print(row)

def update_statistiques_joueur(id, new_attack=None, new_defense=None, new_vitesse=None):
    updates = []
    if new_attack is not None:
        updates.append("attack = ?")
    if new_defense is not None:
        updates.append("defense = ?")
    if new_vitesse is not None:
        updates.append("vitesse = ?")
    query = f'UPDATE statistiques_joueur SET {", ".join(updates)} WHERE id = ?;'
    values = [val for val in (new_attack, new_defense, new_vitesse) if val is not None]
    values.append(id)
    cursor.execute(query, values)
    conn.commit()
    print("Statistiques du joueur mises à jour avec succès.")

def delete_statistiques_joueur_by_id(player_id):
    query = 'DELETE FROM statistiques_joueur WHERE id = ?;'
    cursor.execute(query, (player_id,))
    conn.commit()
    print(f"Joueur avec l'id {player_id} supprimé avec succès.")

create_statistiques_joueur(random.randint(1, 100), None, random.randint(1, 100), "2023-11-06T10:00:00Z")
create_statistiques_joueur(random.randint(1, 100), None, random.randint(1, 100), "2024-11-06T10:00:00Z")
# read_statistiques_joueur()
# update_statistiques_joueur(1, 74, None, 49)
read_statistiques_joueur()
# delete_statistiques_joueur_by_id(22)

# Fermer la connexion
conn.close()
