import { Link } from 'react-router-dom';

const cols = [
  ['Informacije', ['O podjetju', 'Kje smo / Salon', 'Sodelovanje / B2B', 'Pogosta vprašanja', 'Dostava', 'Način plačila', 'Politika zasebnosti', 'Splošni pogoji poslovanja']],
  ['Ponudba', ['Tapete', 'Tapete v akciji', 'Folije', 'Fototapete', 'Stenske nalepke', 'Predpražniki', 'Umetna trava', 'Outlet']],
  ['Pomoč', ['Kalkulator rol', 'Navodila za polaganje tapet', 'Navodila za polaganje folij', 'Novosti / objave', 'Naredi sam / DIY', 'Katalogi tapet']],
];
export default function Footer() {
  return (
    <footer className="foot2">
      <div className="fcols">
        {cols.map(([h, items]) => <div key={h}><h4>{h}</h4>{items.map((i) => <Link key={i} to={i === 'Tapete' ? '/tapete' : '#'}>{i}</Link>)}</div>)}
        <div><h4>Kontaktni podatki</h4><p>Intercont d.o.o., Svet DEKORJA<br />Gorenjska cesta 20, 1234 Mengeš, Slovenija</p><p><b>Delovni čas salona:</b><br />Ponedeljek – petek: 8:00 – 15:30</p><p>(01) 729 10 51<br />info@svetdekorja.si</p></div>
      </div>
      <div className="fbot"><span>Slike so simbolične in ne zagotavljajo lastnosti izdelka. Vzorce tapet si lahko ogledate v našem salonu.<br />Copyright © 2026 Svet Dekorja. Vse pravice pridržane.</span><span className="pay">PayPal · VISA · Mastercard · Maestro · AmEx</span></div>
    </footer>
  );
}
