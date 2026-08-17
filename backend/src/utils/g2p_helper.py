import sys
import json
import string
from g2p_en import G2p


def word_to_phonemes(text):
    g2p = G2p()

    clean_text = text.translate(str.maketrans('', '', string.punctuation))

    phonemes = g2p(clean_text)

    clean_phonemes = [
        ''.join([char for char in phone if not char.isdigit()])
        for phone in phonemes if phone.strip()
    ]
    return clean_phonemes


if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
        result = word_to_phonemes(input_text)
        print(json.dumps(result))
