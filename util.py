import secrets
import urllib.parse
import webbrowser
import os

# Generate state
state = secrets.token_urlsafe(16)
print(f"Generated state (save this): {state}")

# Build auth URL
CLIENT_ID = os.getenv("WHOOP_CLIENT_ID")
CALLBACK_URL = os.getenv("WHOOP_CALLBACK_URL") # This can be any URL
WHOOP_BASE_URL = "https://api.prod.whoop.com"

params = {
    'response_type': 'code',
    'client_id': CLIENT_ID,
    'redirect_uri': CALLBACK_URL,
    'scope': 'offline read:profile',
    'state': state
}

auth_url = f"{WHOOP_BASE_URL}/oauth/oauth2/auth?" + urllib.parse.urlencode(params)
print(f"\n1. Visit this URL:")
print(auth_url)

webbrowser.open(auth_url)

print(f"\n2. After authorizing, you'll get redirected to a non-existent page.")
print(f"3. Copy the ENTIRE URL from your browser's address bar and paste it below:")

# Get the callback URL from user
callback_url = input("\nPaste the full callback URL here: ")

# Parse the callback URL
parsed = urllib.parse.urlparse(callback_url)
params = urllib.parse.parse_qs(parsed.query)

received_state = params.get('state', [None])[0]
auth_code = params.get('code', [None])[0]
error = params.get('error', [None])[0]

if error:
    print(f"Error: {error}")
    print(f"Description: {params.get('error_description', [''])[0]}")
else:
    # Verify state
    if received_state != state:
        print("ERROR: State mismatch!")
    else:
        print(f"✅ State verified!")
        print(f"Authorization code: {auth_code}")
        
        # Now exchange code for token
        # ... (token exchange code here)
        