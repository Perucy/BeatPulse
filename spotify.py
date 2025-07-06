import requests
import os
import json
from dotenv import load_dotenv
from requests_oauthlib import OAuth2Session

load_dotenv()

class SpotifyClient:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

if __name__ == "__main__":
    client = SpotifyClient()
    print(f"Client ID: {client.client_id}")