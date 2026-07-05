// Helper di presentazione per le entità (personaggio | gruppo). Funzioni pure,
// solo VIEW: mappano il `kind` a icona, etichetta e destinazione di rotta.
// Centralizzano i ternari `kind === 'group' ? … : …` che erano duplicati in
// FacingView, EntityPicker, RelationList e nelle card.

// Nome dell'Icon per il kind: gruppo → 'users', personaggio → 'user'.
export function kindIcon(kind) {
  const name = kind === 'group' ? 'users' : 'user';
  return name;
}

// Etichetta leggibile del kind (badge, aria-label del glifo).
export function kindLabel(kind) {
  const label = kind === 'group' ? 'Gruppo' : 'Personaggio';
  return label;
}

// Destinazione vue-router per il profilo/scheda di un'entità del dato kind.
export function entityRouteTo(kind, id) {
  const name = kind === 'group' ? 'groupProfile' : 'profile';
  const location = { name, params: { id } };
  return location;
}
