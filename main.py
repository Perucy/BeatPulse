import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

whoop_client_id = os.getenv("WHOOP_CLIENT_ID")
whoop_client_secret = os.getenv("WHOOP_CLIENT_SECRET")

class WhoopClient:
    def __init__(self, client_id, client_secret):
        self.client_id = client_id,
        self.client_secret = client_secret,
        self.base_url = "https://api.prod.whoop.com"

def main():
    w_client = WhoopClient(whoop_client_id, whoop_client_secret)
    # print("Whoop client id:", w_client.client_id[0])
    # print("Whoop client secret:", w_client.client_secret[0])
    # print("Base URL:", w_client.base_url)


if __name__ == "__main__":
    main()
