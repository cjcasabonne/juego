import { questionTaxonomy } from '../../shared/catalog/question-taxonomy';
import PageShell from '../../shared/components/PageShell';

const cardStyle = {
  background: '#fff',
  border: '1px solid #eadff5',
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 14px 32px rgba(105, 65, 151, 0.08)',
};

export default function CategoriesPage() {
  return (
    <PageShell title="Categories" backTo="/questions">
      <section style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#8b6da8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
          Catalog
        </p>
        <h2 style={{ margin: 0, fontSize: 30, color: '#1f1527' }}>Category and subcategory map</h2>
        <p style={{ margin: 0, maxWidth: 760, color: '#5e4b72', lineHeight: 1.6 }}>
          Families of game questions designed for preference and guessing dynamics. Use `category` for the family and
          `subcategory` for the specific tone or scenario inside that family.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {questionTaxonomy.map((category) => (
          <article key={category.slug} style={cardStyle}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 20, color: '#241630' }}>{category.label}</h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    color: '#7b5a98',
                    background: '#f5ecff',
                    borderRadius: 999,
                    padding: '6px 10px',
                  }}
                >
                  {category.slug}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {category.subcategories.map((subcategory) => (
                  <span
                    key={`${category.slug}-${subcategory.slug}`}
                    style={{
                      fontSize: 13,
                      color: '#4e3964',
                      background: '#fff6df',
                      borderRadius: 999,
                      padding: '7px 10px',
                    }}
                  >
                    {subcategory.label}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
