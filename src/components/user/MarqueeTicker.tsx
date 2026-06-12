'use client';

const items = [
  'Bridal Silk',
  'Wedding Collection',
  'Designer Silk',
  'Festive Collection',
  'Kanchipuram',
  'Banarasi',
  'Handwoven Heritage',
  'Exclusive Drapes',
];

export default function MarqueeTicker() {
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden py-4" style={{ borderTop: '1px solid rgba(200,169,107,0.1)', borderBottom: '1px solid rgba(200,169,107,0.1)' }}>
      <div className="flex animate-marquee whitespace-nowrap gap-12">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: 'rgba(200,169,107,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '3px',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
