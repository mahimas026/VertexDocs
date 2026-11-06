
# Vertex Docs - Multilingual Configuration
# Initial target: 12 languages

SUPPORTED_LANGUAGES = [
    {
        "code": "en",
        "name": "English",
        "script": "Latin"
    },
    {
        "code": "ta",
        "name": "Tamil",
        "script": "Tamil"
    },
    {
        "code": "hi",
        "name": "Hindi",
        "script": "Devanagari"
    },
    {
        "code": "ml",
        "name": "Malayalam",
        "script": "Malayalam"
    },
    {
        "code": "te",
        "name": "Telugu",
        "script": "Telugu"
    },
    {
        "code": "ja",
        "name": "Japanese",
        "script": "Japanese"
    },
    {
        "code": "de",
        "name": "German",
        "script": "Latin"
    },
    {
        "code": "sa",
        "name": "Sanskrit",
        "script": "Devanagari"
    },
    {
        "code": "kn",
        "name": "Kannada",
        "script": "Kannada"
    },
    {
        "code": "bn",
        "name": "Bengali",
        "script": "Bengali"
    },
    {
        "code": "fr",
        "name": "French",
        "script": "Latin"
    },
    {
        "code": "es",
        "name": "Spanish",
        "script": "Latin"
    }
]


def get_supported_languages():
    return SUPPORTED_LANGUAGES


def get_language_by_code(language_code: str):
    for language in SUPPORTED_LANGUAGES:
        if language["code"] == language_code:
            return language

    return None
