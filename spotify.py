import requests
import os
import json
from dotenv import load_dotenv
from requests_oauthlib import OAuth2Session
from flask import Flask, request, redirect, jsonify
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app)


os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

class SpotifyClient:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.base_url = "https://accounts.spotify.com"
        self.api_base_url = "https://api.spotify.com/v1"
        self.redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")

        self.auth_url = f"{self.base_url}/authorize"
        self.token_url = f"{self.base_url}/api/token"

        self.scope = [
            "user-read-recently-played", 
            "user-top-read",
            "playlist-read-private",
            "playlist-read-collaborative"
        ]
        self.oauth = None
        self.token = None

    def get_authorization_url(self):
        self.oauth = OAuth2Session(
            client_id=self.client_id,
            scope=self.scope,
            redirect_uri=self.redirect_uri
        )
        auth_url, state = self.oauth.authorization_url(self.auth_url)
        return auth_url
    
    def get_token_from_code(self, callback_url):
        self.token = self.oauth.fetch_token(
            self.token_url,
            authorization_response=callback_url, 
            client_secret=self.client_secret,
            include_client_id=True,
            method='POST'
        )
        return self.token
    
    def make_spotify_request(self, endpoint, access_token):
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        url = f"{self.api_base_url}{endpoint}"
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error making this request to {endpoint}: {e}")
            return None

    def get_user_profile(self, access_token):
        endpoint = "/me"
        return self.make_spotify_request(endpoint, access_token)
      
    def get_top_artists(self, access_token):
        endpoint = "/me/top/artists"
        return self.make_spotify_request(endpoint, access_token)
    
    def get_user_playlists(self, access_token):
        endpoint = "/me/playlists?limit=5"
        return self.make_spotify_request(endpoint, access_token)
        
user_tokens = {} 

@app.route('/spotify/auth_url')
def get_auth_url():
    client = SpotifyClient()
    auth_url = client.get_authorization_url()
    return jsonify({"auth_url": auth_url})

@app.route('/spotify/callback')
def handle_callback():
    client = SpotifyClient()
    auth_code = request.args.get('code')

    if not auth_code:
        return jsonify({"error": "Authorization code not provided"}), 400
    
    callback_url = f"{client.redirect_uri}?code={auth_code}"

    try:
        token = client.get_token_from_code(callback_url)
        user_profile = client.get_user_profile(token['access_token'])
        if user_profile and 'id' in user_profile:
            user_id = user_profile['id']
            user_tokens[user_id] = token

            return jsonify({
                "access_token": token['access_token'],
                "user_id": user_id,
                "expires_in": token.get('expires_in'),
                "refresh_token": token.get('refresh_token')
            })
        else:
            return jsonify({"error": "Failed to retrieve user profile"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/spotify/profile/<user_id>')
def get_user_profile(user_id):
    if user_id not in user_tokens:
        return jsonify({"error": "User not authenticated"}), 401
    
    access_token = user_tokens[user_id]['access_token']
    client = SpotifyClient()
    profile = client.get_user_profile(access_token)
    
    if profile:
        return jsonify(profile)
    else:
        return jsonify({"error": "Failed to retrieve user profile"}), 500

@app.route('/spotify/playlists/<user_id>')  
def get_user_playlists(user_id):
    if user_id not in user_tokens:
        return jsonify({"error": "User not authenticated"}), 401
    
    access_token = user_tokens[user_id]['access_token']
    client = SpotifyClient()
    playlists = client.get_user_playlists(access_token)
    
    if playlists:
        return jsonify(playlists)
    else:
        return jsonify({"error": "Failed to retrieve user playlists"}), 500
     
@app.route('/')
def home():
    return "Spotify Auth Server is Running"
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True) 