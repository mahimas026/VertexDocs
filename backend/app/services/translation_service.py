import gc
import re
import textwrap
from pathlib import Path

import argostranslate.translate
import argostranslate.sbd
import ctranslate2

from app.language_config import SUPPORTED_LANGUAGES


# --------------------------------------------------
# ARGOS TRANSLATOR CACHE
# --------------------------------------------------

_TRANSLATOR_CACHE = {}


# --------------------------------------------------
# INDIC TRANS2 CONFIGURATION
# --------------------------------------------------

INDICTRANS_MODELS = {
    "en-indic": "ai4bharat/indictrans2-en-indic-dist-200M",
    "indic-en": "ai4bharat/indictrans2-indic-en-dist-200M",
}

INDIC_LANGUAGE_CODES = {
    "en": "eng_Latn",
    "ta": "tam_Taml",
    "hi": "hin_Deva",
    "ml": "mal_Mlym",
    "te": "tel_Telu",
    "sa": "san_Deva",
    "kn": "kan_Knda",
    "bn": "ben_Beng",
}

HF_CACHE = (
    Path.home()
    / ".cache"
    / "huggingface"
    / "hub"
)

_MODEL_CACHE = None
_MODEL_NAME = None


# --------------------------------------------------
# LOAD INDIC TRANS MODEL
# Only one model stays in memory at a time.
# --------------------------------------------------

def load_indic_model(direction):

    global _MODEL_CACHE
    global _MODEL_NAME

    import torch

    from transformers import (
        AutoTokenizer,
        AutoModelForSeq2SeqLM
    )

    from IndicTransToolkit import IndicProcessor

    model_name = INDICTRANS_MODELS[direction]

    if _MODEL_CACHE is not None and _MODEL_NAME == model_name:
        return _MODEL_CACHE

    # Release previous model before loading another.
    if _MODEL_CACHE is not None:

        del _MODEL_CACHE
        _MODEL_CACHE = None
        _MODEL_NAME = None

        gc.collect()

        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    print(f"Loading IndicTrans2 model: {model_name}")

    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        trust_remote_code=True,
        local_files_only=True
    )

    model = AutoModelForSeq2SeqLM.from_pretrained(
        model_name,
        trust_remote_code=True,
        local_files_only=True
    )

    model.to("cpu")
    model.eval()

    processor = IndicProcessor(inference=True)

    _MODEL_CACHE = {
        "tokenizer": tokenizer,
        "model": model,
        "processor": processor
    }

    _MODEL_NAME = model_name

    print("IndicTrans2 model loaded successfully.")

    return _MODEL_CACHE


# --------------------------------------------------
# SPLIT LONG TEXT INTO SMALL CHUNKS
# --------------------------------------------------

def split_text(text, max_chars=400):

    paragraphs = text.splitlines()

    chunks = []

    for paragraph in paragraphs:

        if not paragraph.strip():
            chunks.append("")
            continue

        if len(paragraph) <= max_chars:
            chunks.append(paragraph)
            continue

        sentences = re.split(
            r'(?<=[.!?।])\s+',
            paragraph
        )

        current = ""

        for sentence in sentences:

            if len(sentence) > max_chars:

                if current:
                    chunks.append(current)
                    current = ""

                words = textwrap.wrap(
                    sentence,
                    width=max_chars,
                    break_long_words=False,
                    break_on_hyphens=False
                )

                chunks.extend(words)
                continue

            if not current:
                current = sentence

            elif len(current) + len(sentence) + 1 <= max_chars:
                current += " " + sentence

            else:
                chunks.append(current)
                current = sentence

        if current:
            chunks.append(current)

    return chunks


# --------------------------------------------------
# INDIC TRANS2 TRANSLATION
# --------------------------------------------------

def indictrans_translate(
    text,
    source_code,
    target_code,
    direction
):

    import torch

    model_data = load_indic_model(direction)

    tokenizer = model_data["tokenizer"]
    model = model_data["model"]
    processor = model_data["processor"]

    chunks = split_text(text)

    translated_chunks = []

    for chunk in chunks:

        if not chunk.strip():
            translated_chunks.append(chunk)
            continue

        prepared = processor.preprocess_batch(
            [chunk],
            src_lang=source_code,
            tgt_lang=target_code
        )

        inputs = tokenizer(
            prepared,
            truncation=True,
            padding="longest",
            max_length=256,
            return_tensors="pt",
            return_attention_mask=True
        )

        with torch.no_grad():

            generated = model.generate(
                **inputs,
                max_length=256,
                num_beams=5
            )

        decoded = tokenizer.batch_decode(
            generated,
            skip_special_tokens=True
        )

        processed = processor.postprocess_batch(
            decoded,
            lang=target_code
        )

        translated_chunks.append(processed[0])

    return "\n".join(translated_chunks)


# --------------------------------------------------
# ARGOS TRANSLATION
# --------------------------------------------------

def argos_translate(text, source_lang, target_lang):

    installed_languages = (
        argostranslate.translate.get_installed_languages()
    )

    source_language = next(
        (
            lang for lang in installed_languages
            if lang.code == source_lang
        ),
        None
    )

    target_language = next(
        (
            lang for lang in installed_languages
            if lang.code == target_lang
        ),
        None
    )

    if source_language is None or target_language is None:
        raise ValueError(
            "Source or target language package is not installed"
        )

    translation = source_language.get_translation(
        target_language
    )

    if translation is None:
        raise ValueError(
            f"Translation from {source_lang} to "
            f"{target_lang} is not installed"
        )

    # Preserve existing Bengali MiniSBD handling.
    if source_lang == "bn":

        package = translation.underlying.pkg

        sentencizer = argostranslate.sbd.MiniSBDSentencizer(
            package
        )

        translator = translation.underlying.translator

        if translator is None:

            model_path = str(
                package.package_path / "model"
            )

            if model_path not in _TRANSLATOR_CACHE:

                settings = argostranslate.translate.settings

                _TRANSLATOR_CACHE[model_path] = (
                    ctranslate2.Translator(
                        model_path,
                        device=settings.device,
                        inter_threads=settings.inter_threads,
                        intra_threads=settings.intra_threads,
                        compute_type=settings.compute_type
                    )
                )

            translator = _TRANSLATOR_CACHE[model_path]

        result = argostranslate.translate.apply_packaged_translation(
            package,
            text,
            translator,
            sentencizer,
            num_hypotheses=1
        )

        return result[0].value

    return translation.translate(text)


# --------------------------------------------------
# MAIN TRANSLATION FUNCTION
# --------------------------------------------------

def translate_text(
    text: str,
    source_lang: str,
    target_lang: str
) -> str:

    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    configured_codes = {
        language["code"]
        for language in SUPPORTED_LANGUAGES
    }

    if source_lang not in configured_codes:
        raise ValueError("Unsupported source language")

    if target_lang not in configured_codes:
        raise ValueError("Unsupported target language")

    if source_lang == target_lang:
        return text

    source_supported = source_lang in INDIC_LANGUAGE_CODES
    target_supported = target_lang in INDIC_LANGUAGE_CODES

    # Both languages supported by IndicTrans2.
    if source_supported and target_supported:

        source_code = INDIC_LANGUAGE_CODES[source_lang]
        target_code = INDIC_LANGUAGE_CODES[target_lang]

        # English -> Indian language.
        if source_lang == "en":

            return indictrans_translate(
                text,
                source_code,
                target_code,
                "en-indic"
            )

        # Indian language -> English.
        if target_lang == "en":

            return indictrans_translate(
                text,
                source_code,
                target_code,
                "indic-en"
            )

        # Indian language -> Indian language.
        # First translate to English.
        english_text = indictrans_translate(
            text,
            source_code,
            "eng_Latn",
            "indic-en"
        )

        # Then translate English to target language.
        return indictrans_translate(
            english_text,
            "eng_Latn",
            target_code,
            "en-indic"
        )

    # Unsupported IndicTrans2 language combination:
    # Try an installed direct Argos translation pair.
    return argos_translate(
        text,
        source_lang,
        target_lang
    )


# --------------------------------------------------
# LANGUAGE AVAILABILITY
# --------------------------------------------------

def get_supported_languages():

    installed_languages = (
        argostranslate.translate.get_installed_languages()
    )

    installed_codes = {
        language.code
        for language in installed_languages
    }

    argos_pairs = []
    all_pairs = []
    available_codes = set()

    for source in installed_languages:

        for target in source.translations_from:

            pair = {
                "source": source.code,
                "target": target.to_lang.code
            }

            argos_pairs.append(pair)
            all_pairs.append(pair)

            available_codes.add(source.code)
            available_codes.add(target.to_lang.code)

    # Check whether IndicTrans2 model files are cached.
    en_indic_path = (
        HF_CACHE
        / "models--ai4bharat--indictrans2-en-indic-dist-200M"
    )

    indic_en_path = (
        HF_CACHE
        / "models--ai4bharat--indictrans2-indic-en-dist-200M"
    )

    has_en_indic = en_indic_path.exists()
    has_indic_en = indic_en_path.exists()

    indic_codes = set(INDIC_LANGUAGE_CODES)

    # Add English -> Indian language pairs.
    if has_en_indic:

        for language_code in indic_codes:

            if language_code == "en":
                continue

            all_pairs.append({
                "source": "en",
                "target": language_code
            })

            available_codes.add("en")
            available_codes.add(language_code)

    # Add Indian language -> English pairs.
    if has_indic_en:

        for language_code in indic_codes:

            if language_code == "en":
                continue

            all_pairs.append({
                "source": language_code,
                "target": "en"
            })

            available_codes.add(language_code)
            available_codes.add("en")

    # Add Indian -> Indian pairs through English.
    if has_en_indic and has_indic_en:

        for source in indic_codes:

            for target in indic_codes:

                if source == target:
                    continue

                if source == "en" or target == "en":
                    continue

                all_pairs.append({
                    "source": source,
                    "target": target
                })

                available_codes.add(source)
                available_codes.add(target)

    # Remove duplicate pairs.
    unique_pairs = []
    seen_pairs = set()

    for pair in all_pairs:

        key = (
            pair["source"],
            pair["target"]
        )

        if key not in seen_pairs:
            seen_pairs.add(key)
            unique_pairs.append(pair)

    languages = []

    for language in SUPPORTED_LANGUAGES:

        code = language["code"]

        is_installed = code in installed_codes
        is_available = code in available_codes

        if is_available:
            status = "available"

        elif is_installed:
            status = "installed_no_translation_pairs"

        else:
            status = "not_installed"

        languages.append({
            **language,
            "configured": True,
            "installed": is_installed,
            "available": is_available,
            "status": status
        })

    return {
        "total_configured": len(languages),

        "total_installed": sum(
            item["installed"]
            for item in languages
        ),

        "total_available": sum(
            item["available"]
            for item in languages
        ),

        "languages": languages,
        "translation_pairs": unique_pairs
    }
