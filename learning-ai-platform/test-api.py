import requests

url = 'http://localhost:4001/api/users/preset-avatars'

print('Testing API connection to:', url)

try:
    response = requests.get(url, timeout=5)
    print('Response status code:', response.status_code)
    print('Response headers:', response.headers)
    if response.status_code == 200:
        print('Response body:', response.json())
    else:
        print('Response text:', response.text)
except Exception as e:
    print('Error:', e)