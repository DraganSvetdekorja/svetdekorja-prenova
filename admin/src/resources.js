// Field config drives the generic list + edit form (Resource.jsx)
const COLORS = ['', 'Bež', 'Črna', 'Modra', 'Rjava', 'Zlata', 'Zelena', 'Siva', 'Večbarvna', 'Oranžna', 'Pastelna', 'Roza', 'Vijolična', 'Rdeča', 'Srebrna', 'Petrolej', 'Turkizna', 'Bela', 'Rumena'];
export const RESOURCES = {
  products: { label: 'Izdelki', pk: 'sku', cols: ['sku', 'name', 'price', 'brand', 'collection', 'category_id', 'active'], head: ['SKU', 'Naziv', 'Cena', 'Znamka', 'Kolekcija', 'Kat.', 'Status'],
    blank: { active: true, in_stock: true, featured: false, media_gallery: [], spec: {} },
    fields: [['sku', 'SKU', 'text', { req: 1 }], ['name', 'Naziv', 'text'], ['slug', 'Slug (URL)', 'text'], ['category_id', 'Kategorija', 'cat'], ['sub', 'Podkategorija (Folije / Oprema za dom)', 'sub'],
      ['price', 'Cena (trenutna, z DDV)', 'number'], ['old_price', 'Redna cena (prikazana prečrtana, če je višja)', 'number'], ['discount_pct', 'Popust (npr. -20%)', 'text'], ['badge', 'Značka (npr. -20%, Novo)', 'text'],
      ['brand', 'Znamka', 'text'], ['collection', 'Kolekcija', 'text'], ['material', 'Material', 'text'], ['color', 'Barva', 'text'], ['style', 'Stil', 'text'], ['room', 'Prostor (z vejicami)', 'text'],
      ['tip', 'Tip artikla', 'text'], ['unit', 'Enota (rol, kos, m, m2, kpl)', 'text'], ['dim_label', 'Dimenzija (npr. 10,05 m x 0,53 m)', 'text'], ['dobavni_rok', 'Dobavni rok', 'text'],
      ['short_description', 'Kratek opis (HTML)', 'textarea'], ['description', 'Opis (HTML)', 'textarea', { rows: 8 }],
      ['main_image', 'Glavna slika (URL)', 'text', { upload: 1 }], ['media_gallery', 'Galerija (en URL na vrstico)', 'lines', { upload: 1 }],
      ['meta_title', 'Meta naslov', 'text'], ['meta_description', 'Meta opis', 'textarea', { rows: 2 }],
      ['spec', 'Značilnosti (ključ=vrednost, ena na vrstico)', 'kv'], ['in_stock', 'Na zalogi', 'bool'], ['featured', 'Izpostavljen', 'bool'], ['active', 'Objavljen (viden v trgovini)', 'bool']] },
  subcategories: { label: 'Podkategorije', pk: 'slug', cols: ['slug', 'name', 'parent', 'position', 'active'], head: ['Slug', 'Ime', 'Skupina', 'Vrstni red', 'Aktivna'], blank: { active: true, position: 0 },
    fields: [['slug', 'Slug (npr. tepihi)', 'text', { req: 1 }], ['name', 'Ime (prikaz v meniju)', 'text', { req: 1 }], ['parent', 'Skupina (slug: folije, oprema, tapete …)', 'text', { req: 1 }], ['position', 'Vrstni red', 'number'], ['active', 'Aktivna (prikazana v meniju)', 'bool']] },
  categories: { label: 'Kategorije', pk: 'id', cols: ['id', 'name', 'slug', 'position'], head: ['ID', 'Ime', 'Slug', 'Vrstni red'], blank: { active: true, position: 0 },
    fields: [['name', 'Ime', 'text', { req: 1 }], ['slug', 'Slug', 'text'], ['parent', 'Nadrejena kategorija', 'text'], ['description', 'Opis', 'textarea'], ['image', 'Slika (URL)', 'text', { upload: 1 }], ['position', 'Vrstni red', 'number'], ['active', 'Aktivna', 'bool']] },
  posts: { label: 'Blog', pk: 'id', cols: ['id', 'title', 'published', 'created'], head: ['ID', 'Naslov', 'Objavljeno', 'Ustvarjeno'], blank: { published: true },
    fields: [['title', 'Naslov', 'text', { req: 1 }], ['slug', 'Slug', 'text'], ['cover', 'Naslovna slika (URL)', 'text', { upload: 1 }], ['excerpt', 'Povzetek', 'textarea', { rows: 3 }], ['body', 'Vsebina (HTML)', 'textarea', { rows: 14 }], ['published', 'Objavljeno', 'bool']] },
  attributes: { label: 'Atributi', pk: 'id', cols: ['id', 'name', 'code', 'type'], head: ['ID', 'Ime', 'Koda', 'Tip'], blank: { type: 'select', options: [] },
    fields: [['name', 'Ime', 'text', { req: 1 }], ['code', 'Koda', 'text', { req: 1 }], ['type', 'Tip', 'select', { options: ['select', 'multiselect', 'text', 'color'] }], ['options', 'Vrednosti (ena na vrstico)', 'lines']] },
};
