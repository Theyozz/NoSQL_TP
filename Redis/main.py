import redis
import json
from datetime import datetime

r = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)

def enregistrer_attaque(player_id, enemy_id, damage, attack_id):
    attack_data = {
        "player_id": player_id,
        "enemy_id": enemy_id,
        "damage": damage,
        "attack_id": attack_id,
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    }
    
    r.rpush(f"attack:{player_id}:{enemy_id}", json.dumps(attack_data))
    
    return f"Attaque {attack_id} enregistrée avec succès."

def enregistrer_mouvement(player_id, coordinates, ttl):
    move_data = {
        "player_id": player_id,
        "coordinates": coordinates,
        "timestamp": datetime.utcnow().isoformat() + 'Z',
        "TTL": ttl
    }
    
    r.setex(f"move:{player_id}:{coordinates}", ttl, json.dumps(move_data))
    
    return f"Mouvement du joueur {player_id} enregistré avec succès."

def mettre_a_jour_classement(player_id, score):
    rank = r.zadd("leaderboard:24h", {player_id: score})
    
    player_rank = r.zrevrank("leaderboard:24h", player_id)
    
    return f"Classement du joueur {player_id} mis à jour : {player_rank + 1} (score : {score})."

if __name__ == "__main__":
    print(enregistrer_attaque("player123", "enemy456", 100, "attack789"))

    print(enregistrer_mouvement("player123", "x:100,y:200,z:300", 30))

    print(mettre_a_jour_classement("player123", 1500))
