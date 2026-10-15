// Main menu. `parent` = slug of a category group whose subcategories (from the admin) become the dropdown.
export const MENU = [
  { label: 'Tapete', to: '/k/tapete' },
  { label: 'Tapete v akciji', to: '/k/tapete?akcija=1', cls: 'sale' },
  { label: 'Folije', to: '/k/folije', parent: 'folije' },
  { label: 'Fototapete', to: '/k/fototapete' },
  { label: 'Posterji', to: '/k/posterji' },
  { label: 'Slike na platnu', to: '/k/slike' },
  { label: 'Stenske nalepke', to: '/k/nalepke' },
  { label: 'Umetna trava', to: '/k/trava' },
  { label: 'Oprema za dom', to: '/k/oprema', parent: 'oprema' },
  { label: 'Predpražniki', to: '/k/predpraznik' },
  { label: 'Pripomočki in lepila', to: '/k/lepila' },
  { label: 'Outlet', cls: 'out' },
];
