import re

# Offline rule-based Tamil transliteration.
# Unicode escape sequences prevent source-file encoding corruption.

COMMON = {
    "vanakkam": "\u0bb5\u0ba3\u0b95\u0bcd\u0b95\u0bae\u0bcd",
    "nandri": "\u0ba8\u0ba9\u0bcd\u0bb1\u0bbf",
    "amma": "\u0b85\u0bae\u0bcd\u0bae\u0bbe",
    "appa": "\u0b85\u0baa\u0bcd\u0baa\u0bbe",
    "tamil": "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd",
    "tamizh": "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd",
    "epdi": "\u0b8e\u0baa\u0bcd\u0baa\u0b9f\u0bbf",
    "eppadi": "\u0b8e\u0baa\u0bcd\u0baa\u0b9f\u0bbf",
    "enna": "\u0b8e\u0ba9\u0bcd\u0ba9",
    "nalla": "\u0ba8\u0bb2\u0bcd\u0bb2",
    "irukken": "\u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc7\u0ba9\u0bcd",
    "irukkeenga": "\u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc0\u0b99\u0bcd\u0b95",
    "irukkinga": "\u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc0\u0b99\u0bcd\u0b95",
    "neenga": "\u0ba8\u0bc0\u0b99\u0bcd\u0b95",
    "ungal": "\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
    "ungalukku": "\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1",
    "naan": "\u0ba8\u0bbe\u0ba9\u0bcd",
    "nan": "\u0ba8\u0bbe\u0ba9\u0bcd",
    "nee": "\u0ba8\u0bc0",
    "saptiya": "\u0b9a\u0bbe\u0baa\u0bcd\u0baa\u0bbf\u0b9f\u0bcd\u0b9f\u0bbf\u0baf\u0bbe",
}

REVERSE_WORDS = {
    "\u0bb5\u0ba3\u0b95\u0bcd\u0b95\u0bae\u0bcd": "vanakkam",
    "\u0b8e\u0baa\u0bcd\u0baa\u0b9f\u0bbf": "eppadi",
    "\u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc0\u0b99\u0bcd\u0b95": "irukkeenga",
    "\u0ba8\u0ba9\u0bcd\u0bb1\u0bbf": "nandri",
}

VOWELS = {
    "aa": "\u0b86", "ii": "\u0b88", "ee": "\u0b88",
    "uu": "\u0b8a", "oo": "\u0b8a", "ai": "\u0b90",
    "ae": "\u0b8f", "a": "\u0b85", "i": "\u0b87",
    "u": "\u0b89", "e": "\u0b8e", "o": "\u0b92",
}

SIGNS = {
    "aa": "\u0bbe", "ii": "\u0bc0", "ee": "\u0bc0",
    "uu": "\u0bc2", "oo": "\u0bc2", "ai": "\u0bc8",
    "ae": "\u0bc7", "a": "", "i": "\u0bbf",
    "u": "\u0bc1", "e": "\u0bc6", "o": "\u0bca",
}

CONSONANTS = {
    "ng": "\u0b99", "nj": "\u0b9e", "ny": "\u0b9e",
    "zh": "\u0bb4", "sh": "\u0bb7", "th": "\u0ba4",
    "dh": "\u0ba4", "ch": "\u0b9a",
    "k": "\u0b95", "g": "\u0b95", "s": "\u0b9a",
    "j": "\u0b9c", "t": "\u0b9f", "d": "\u0b9f",
    "n": "\u0ba9", "p": "\u0baa", "b": "\u0baa",
    "m": "\u0bae", "y": "\u0baf", "r": "\u0bb0",
    "l": "\u0bb2", "v": "\u0bb5", "w": "\u0bb5",
    "h": "\u0bb9", "f": "\u0b83\u0baa",
}

PULLI = "\u0bcd"

def to_tamil(text: str) -> str:
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    words = re.findall(r"[A-Za-z]+|[^A-Za-z]+", text)
    output = []

    for word in words:
        if not word.isalpha():
            output.append(word)
            continue

        lower = word.lower()
        if lower in COMMON:
            output.append(COMMON[lower])
            continue

        result = []
        i = 0

        while i < len(lower):
            consonant = next(
                (c for c in sorted(CONSONANTS, key=len, reverse=True)
                 if lower.startswith(c, i)), None
            )

            if consonant:
                base = CONSONANTS[consonant]
                i += len(consonant)

                vowel = next(
                    (v for v in sorted(VOWELS, key=len, reverse=True)
                     if lower.startswith(v, i)), None
                )

                if vowel:
                    result.append(base + SIGNS[vowel])
                    i += len(vowel)
                else:
                    result.append(base + PULLI)
                continue

            vowel = next(
                (v for v in sorted(VOWELS, key=len, reverse=True)
                 if lower.startswith(v, i)), None
            )

            if vowel:
                result.append(VOWELS[vowel])
                i += len(vowel)
            else:
                result.append(lower[i])
                i += 1

        output.append("".join(result))

    return "".join(output)


INDEPENDENT = {
    "\u0b85": "a", "\u0b86": "aa", "\u0b87": "i",
    "\u0b88": "ee", "\u0b89": "u", "\u0b8a": "oo",
    "\u0b8e": "e", "\u0b8f": "ae", "\u0b90": "ai",
    "\u0b92": "o", "\u0b93": "oo",
}

BASE_ROMAN = {
    "\u0b95": "k", "\u0b99": "ng", "\u0b9a": "ch",
    "\u0b9c": "j", "\u0b9e": "ny", "\u0b9f": "t",
    "\u0ba3": "n", "\u0ba4": "th", "\u0ba8": "n",
    "\u0ba9": "n", "\u0baa": "p", "\u0bae": "m",
    "\u0baf": "y", "\u0bb0": "r", "\u0bb2": "l",
    "\u0bb5": "v", "\u0bb4": "zh", "\u0bb3": "l",
    "\u0bb1": "r", "\u0bb7": "sh", "\u0bb8": "s",
    "\u0bb9": "h",
}

SIGN_ROMAN = {
    "\u0bbe": "aa", "\u0bbf": "i", "\u0bc0": "ee",
    "\u0bc1": "u", "\u0bc2": "oo", "\u0bc6": "e",
    "\u0bc7": "ae", "\u0bc8": "ai", "\u0bca": "o",
    "\u0bcb": "oo", "\u0bcc": "au",
}

def to_roman(text: str) -> str:
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    tokens = re.findall(r"[\u0b80-\u0bff]+|[^\u0b80-\u0bff]+", text)
    output = []

    for token in tokens:
        if not any("\u0b80" <= c <= "\u0bff" for c in token):
            output.append(token)
            continue

        if token in REVERSE_WORDS:
            output.append(REVERSE_WORDS[token])
            continue

        result = []
        i = 0

        while i < len(token):
            char = token[i]

            if char in INDEPENDENT:
                result.append(INDEPENDENT[char])
            elif char in BASE_ROMAN:
                roman = BASE_ROMAN[char]
                if i + 1 < len(token) and token[i + 1] == PULLI:
                    result.append(roman)
                    i += 1
                elif i + 1 < len(token) and token[i + 1] in SIGN_ROMAN:
                    result.append(roman + SIGN_ROMAN[token[i + 1]])
                    i += 1
                else:
                    result.append(roman + "a")
            elif char == PULLI:
                pass
            else:
                result.append(char)

            i += 1

        output.append("".join(result))

    return "".join(output)
