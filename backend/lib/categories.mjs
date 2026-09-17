export const automaticCategories=[
  ['cat_business','Business'],['cat_productivity','Productivity'],['cat_ai','AI prototype'],['cat_portfolio','Portfolio'],['cat_utility','Utility'],['cat_other','Other']
];
export function inferCategory({title='',description=''}={}){
  const text=`${title} ${description}`.toLowerCase();
  if(/\b(ai|artificial intelligence|llm|chatbot|gpt|ai-powered)\b/.test(text))return 'cat_ai';
  if(/\b(task|tasks|tracker|todo|to-do|kanban|habit|habits|calendar|productivity|planner)\b/.test(text))return 'cat_productivity';
  if(/\b(academic|academics|researcher|research|portfolio|personal website|cv|resume)\b/.test(text))return 'cat_portfolio';
  if(/\b(pdf|mail merge|converter|utility|calculator|generator|automation|document|tool)\b/.test(text))return 'cat_utility';
  if(/\b(logistics|company|business|agency|store|shop|restaurant|commerce|landing page)\b/.test(text))return 'cat_business';
  return 'cat_other';
}
