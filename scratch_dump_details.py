import json

with open('scratch_proposals_extracted.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('proposal_details_clean.txt', 'w', encoding='utf-8') as out:
    for fname, doc in data.items():
        out.write('='*80 + '\n')
        out.write(f'FILE: {fname}\n')
        out.write('='*80 + '\n')
        if doc['type'] == 'pdf':
            for p in doc['pages']:
                out.write(f'\n--- PAGE {p["page"]} ---\n')
                out.write(p['text'] + '\n')
        elif doc['type'] == 'pptx':
            for s in doc['slides']:
                out.write(f'\n--- SLIDE {s["slide"]} ---\n')
                for el in s['elements']:
                    if el['kind'] == 'text':
                        out.write(el['content'] + '\n')
                    elif el['kind'] == 'table':
                        for r in el['rows']:
                            out.write(' | '.join(r) + '\n')

print('Wrote proposal_details_clean.txt')
