export interface DelegationEdge {
  from: 'law' | 'decree' | 'rule';
  to: 'decree' | 'rule';
  triggerText: string;
}

export interface DelegationGraph {
  nodes: Array<'law' | 'decree' | 'rule'>;
  edges: DelegationEdge[];
}

const RULE_PATTERNS = [
  /대통령령으로\s*정한다/g,
  /부령으로\s*정한다/g,
  /규칙으로\s*정한다/g,
  /총리령으로\s*정한다/g
];

export function parseDelegationGraph(text: string): DelegationGraph {
  const edges: DelegationEdge[] = [];

  RULE_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern) ?? [];
    matches.forEach((triggerText) => {
      if (triggerText.includes('대통령령')) {
        edges.push({ from: 'law', to: 'decree', triggerText });
      } else {
        edges.push({ from: 'decree', to: 'rule', triggerText });
      }
    });
  });

  const hasLawToDecree = edges.some((edge) => edge.from === 'law' && edge.to === 'decree');
  const hasDecreeToRule = edges.some((edge) => edge.from === 'decree' && edge.to === 'rule');

  if (hasLawToDecree && !hasDecreeToRule) {
    edges.push({ from: 'decree', to: 'rule', triggerText: '추정 연계(하위 규칙 위임 가능성)' });
  }

  return {
    nodes: ['law', 'decree', 'rule'],
    edges
  };
}
