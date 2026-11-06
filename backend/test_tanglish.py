import urllib.request, json

tests = [
    "vanakkam eppadi irukkeenga",
    "naan nalla irukken",
    "ungal peyar enna",
    "indru weather romba nalla irukku",
    "naan college pogiren",
    "enna panreenga?",
    "nandri!",
    "enakku 2 books venum",
    "Tamil is a beautiful language",
    "hello nan Tamil pesuven"
]

for text in tests:
    data = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/tanglish/to-tamil",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            print("\nINPUT :", text)
            print("OUTPUT:", result.get("output"))
            print("STATUS:", response.status)
    except Exception as e:
        print("\nFAILED:", text, str(e))
