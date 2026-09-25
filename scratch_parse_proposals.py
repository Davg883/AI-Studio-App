import json

with open('scratch_proposals_extracted.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for fname, doc in data.items():
    print('='*70)
    print(f'PROPOSAL: {fname}')
    print('='*70)
    if doc['type'] == 'pdf':
        for p in doc['pages']:
            txt = p['text']
            for kw in ['tier', 'pricing', 'investment', 'fee', 'option', '£', 'package']:
                if kw in txt.lower():
                    print(f'>>> Page {p["page"]} (matched "{kw}"):')
                    for l in txt.split('\n'):
                        l_clean = l.strip()
                        if any(k in l_clean.lower() for k in ['£', 'tier', 'investment', 'fee', 'package', 'option', 'deliverable', 'scope', 'cost', 'total', 'pilot', 'sprint', 'phase']):
                            print('   ', l_clean)
                    print('-'*40)
                    break
    elif doc['type'] == 'pptx':
        for s in doc['slides']:
            print(f'>>> Slide {s["slide"]}:')
            for el in s['elements']:
                if el['kind'] == 'text':
                    for l in el['content'].split('\n'):
                        l_clean = l.strip()
                        if any(k in l_clean.lower() for k in ['£', 'tier', 'cost', 'fee', 'package', 'option', 'investment', 'garlic', 'deliverable', 'total']):
                            print('   ', l_clean)
                elif el['kind'] == 'table':
                    print('   [TABLE]:', el['rows'])
