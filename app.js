// ─── State ──────────────────────────────────────────────────────────────────
const state = {
  indicationFilter: 'all',   // 'all' | 'MF' | 'PV' | 'GVHD' | 'AA' | 'COVID' | 'Other'
  typeFilter: 'all',          // 'all' | 'Clinical Trial' | 'Review' | 'Congress' | 'Case Report' | 'Guideline'
  yearMin: 2015,
  yearMax: 2025,
  activeCard: null
};

// ─── DOM refs ─────────────────────────────────────────────────────────────
const timelineList  = document.getElementById('timelineList');
const noResults     = document.getElementById('noResults');
const visibleCount  = document.getElementById('visibleCount');
const totalCount    = document.getElementById('totalCount');
const previewPanel  = document.getElementById('previewPanel');
const previewBody   = document.getElementById('previewBody');
const previewBackdrop = document.getElementById('previewBackdrop');
const previewClose  = document.getElementById('previewClose');
const rangeMin      = document.getElementById('rangeMin');
const rangeMax      = document.getElementById('rangeMax');
const rangeFill     = document.getElementById('rangeFill');
const yearMinLabel  = document.getElementById('yearMin');
const yearMaxLabel  = document.getElementById('yearMax');

// ─── Colour maps ─────────────────────────────────────────────────────────
const indicationColor = {
  MF:     { bg: '#EEF2FF', border: '#818CF8', text: '#3730A3' },
  PV:     { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  GVHD:   { bg: '#ECFDF5', border: '#34D399', text: '#065F46' },
  AA:     { bg: '#FDF4FF', border: '#C084FC', text: '#6B21A8' },
  COVID:  { bg: '#FFF1F2', border: '#FB7185', text: '#9F1239' },
  Other:  { bg: '#F1F5F9', border: '#94A3B8', text: '#334155' }
};

const typeIcon = {
  'Clinical Trial': '⚗️',
  'Review':         '📋',
  'Congress':       '🎤',
  'Case Report':    '📝',
  'Guideline':      '📜'
};

// ─── Filter logic ─────────────────────────────────────────────────────────
function filteredPubs() {
  return PUBLICATIONS.filter(p => {
    const indOk = state.indicationFilter === 'all' || p.indication === state.indicationFilter;
    const typeOk = state.typeFilter === 'all' || p.type === state.typeFilter;
    const yearOk = p.year >= state.yearMin && p.year <= state.yearMax;
    return indOk && typeOk && yearOk;
  }).sort((a, b) => b.year - a.year || b.month - a.month);
}

// ─── Render timeline ─────────────────────────────────────────────────────
function render() {
  const pubs = filteredPubs();
  timelineList.innerHTML = '';

  totalCount.textContent = PUBLICATIONS.length;
  visibleCount.textContent = pubs.length;

  if (pubs.length === 0) {
    noResults.style.display = 'flex';
    return;
  }
  noResults.style.display = 'none';

  let currentYear = null;

  pubs.forEach(pub => {
    // Year separator
    if (pub.year !== currentYear) {
      currentYear = pub.year;
      const sep = document.createElement('div');
      sep.className = 'year-separator';
      sep.innerHTML = `<span class="year-badge">${pub.year}</span>`;
      timelineList.appendChild(sep);
    }

    const col = indicationColor[pub.indication] || indicationColor.Other;
    const icon = typeIcon[pub.type] || '📄';

    const card = document.createElement('div');
    card.className = 'pub-card';
    card.dataset.id = pub.id;
    card.style.setProperty('--card-border', col.border);

    card.innerHTML = `
      <div class="card-dot" style="background:${col.border};"></div>
      <div class="card-content">
        <div class="card-meta-row">
          <span class="badge" style="background:${col.bg};color:${col.text};border-color:${col.border};">${pub.indication}</span>
          <span class="badge badge-type">${icon} ${pub.type}</span>
          <span class="card-date">${monthName(pub.month)} ${pub.year}</span>
        </div>
        <h2 class="card-title">${pub.title}</h2>
        <p class="card-authors">${pub.authors}</p>
        <p class="card-journal">${pub.journal}</p>
        <div class="card-tags">
          ${pub.tags.slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    `;

    card.addEventListener('click', () => openPreview(pub));
    timelineList.appendChild(card);
  });
}

// ─── Preview panel ────────────────────────────────────────────────────────
function openPreview(pub) {
  state.activeCard = pub.id;
  const col = indicationColor[pub.indication] || indicationColor.Other;
  const icon = typeIcon[pub.type] || '📄';
  const monthLabel = monthName(pub.month);

  // Build PubMed / journal link
  let linkHtml = '';
  if (pub.pubmedId) {
    linkHtml += `
      <a href="${pub.pubmedUrl}" target="_blank" rel="noopener" class="preview-link pubmed-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        View on PubMed
      </a>`;
  }
  if (pub.doi) {
    linkHtml += `
      <a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener" class="preview-link doi-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Full Article (DOI)
      </a>`;
  }
  if (!pub.pubmedId && !pub.doi && pub.pubmedUrl) {
    linkHtml += `
      <a href="${pub.pubmedUrl}" target="_blank" rel="noopener" class="preview-link pubmed-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        View Source
      </a>`;
  }

  previewBody.innerHTML = `
    <div class="preview-journal-badge" style="background:${col.bg};border-color:${col.border};">
      <div class="preview-journal-icon">${icon}</div>
      <div class="preview-journal-info">
        <span class="preview-journal-name">${pub.journal}</span>
        <span class="preview-journal-date">${monthLabel} ${pub.year}</span>
      </div>
    </div>

    <div class="preview-badges">
      <span class="badge badge-lg" style="background:${col.bg};color:${col.text};border-color:${col.border};">${pub.indication}</span>
      <span class="badge badge-lg badge-type">${icon} ${pub.type}</span>
    </div>

    <h2 class="preview-title">${pub.title}</h2>
    <p class="preview-authors">${pub.authors}</p>

    <div class="preview-divider"></div>

    <div class="preview-abstract-wrap">
      <h3 class="preview-section-label">Abstract</h3>
      <p class="preview-abstract">${pub.abstract}</p>
    </div>

    <div class="preview-tags">
      ${pub.tags.map(t => `<span class="tag">${t}</span>`).join('')}
    </div>

    <div class="preview-links">
      ${linkHtml}
    </div>
  `;

  previewPanel.classList.add('open');
  previewBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePreview() {
  previewPanel.classList.remove('open');
  previewBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  state.activeCard = null;
}

previewClose.addEventListener('click', closePreview);
previewBackdrop.addEventListener('click', closePreview);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePreview(); });

// ─── Year range slider ────────────────────────────────────────────────────
function updateRangeFill() {
  const min = parseInt(rangeMin.value);
  const max = parseInt(rangeMax.value);
  const totalRange = 2025 - 2015;
  const left  = ((min - 2015) / totalRange) * 100;
  const right = ((2025 - max) / totalRange) * 100;
  rangeFill.style.left  = left  + '%';
  rangeFill.style.right = right + '%';
  yearMinLabel.textContent = min;
  yearMaxLabel.textContent = max;
}

rangeMin.addEventListener('input', () => {
  if (parseInt(rangeMin.value) > parseInt(rangeMax.value)) {
    rangeMin.value = rangeMax.value;
  }
  state.yearMin = parseInt(rangeMin.value);
  updateRangeFill();
  render();
});

rangeMax.addEventListener('input', () => {
  if (parseInt(rangeMax.value) < parseInt(rangeMin.value)) {
    rangeMax.value = rangeMin.value;
  }
  state.yearMax = parseInt(rangeMax.value);
  updateRangeFill();
  render();
});

// ─── Chip filters ─────────────────────────────────────────────────────────
function initChipGroup(containerId, onSelect) {
  const container = document.getElementById(containerId);
  const chips = container.querySelectorAll('input[type=checkbox]');
  const allChip = container.querySelector('input[value=all]');

  chips.forEach(chip => {
    chip.addEventListener('change', () => {
      if (chip.value === 'all') {
        // Deselect all others
        chips.forEach(c => {
          c.checked = c.value === 'all';
          c.closest('.chip').classList.toggle('active', c.value === 'all');
        });
        onSelect('all');
      } else {
        // Deselect "All"
        allChip.checked = false;
        allChip.closest('.chip').classList.remove('active');
        chip.closest('.chip').classList.toggle('active', chip.checked);

        // If nothing selected → revert to All
        const anySelected = Array.from(chips).some(c => c.value !== 'all' && c.checked);
        if (!anySelected) {
          allChip.checked = true;
          allChip.closest('.chip').classList.add('active');
          onSelect('all');
        } else {
          // Multi-select: filter shows cards matching ANY selected chip
          const selected = Array.from(chips)
            .filter(c => c.value !== 'all' && c.checked)
            .map(c => c.value);
          onSelect(selected.length === 1 ? selected[0] : selected);
        }
      }
    });
  });
}

// ─── Wiring chip groups to state ─────────────────────────────────────────
initChipGroup('indicationFilters', val => {
  state.indicationFilter = val;
  render();
});

initChipGroup('typeFilters', val => {
  state.typeFilter = val;
  render();
});

// ─── Reset ────────────────────────────────────────────────────────────────
function resetAll() {
  // Indication
  document.querySelectorAll('#indicationFilters input').forEach(c => {
    c.checked = c.value === 'all';
    c.closest('.chip').classList.toggle('active', c.value === 'all');
  });
  // Type
  document.querySelectorAll('#typeFilters input').forEach(c => {
    c.checked = c.value === 'all';
    c.closest('.chip').classList.toggle('active', c.value === 'all');
  });
  // Year
  rangeMin.value = 2015;
  rangeMax.value = 2025;
  state.yearMin = 2015;
  state.yearMax = 2025;
  state.indicationFilter = 'all';
  state.typeFilter = 'all';
  updateRangeFill();
  render();
}

document.getElementById('resetFilters').addEventListener('click', resetAll);

// ─── Multi-value filter support ───────────────────────────────────────────
// Override the filteredPubs to support arrays from multi-select
const _originalFilteredPubs = filteredPubs;
function filteredPubs() {
  return PUBLICATIONS.filter(p => {
    const indFilter = state.indicationFilter;
    const typeFilter = state.typeFilter;
    const indOk  = indFilter === 'all'
      || (Array.isArray(indFilter)  ? indFilter.includes(p.indication)  : p.indication === indFilter);
    const typeOk = typeFilter === 'all'
      || (Array.isArray(typeFilter) ? typeFilter.includes(p.type)        : p.type === typeFilter);
    const yearOk = p.year >= state.yearMin && p.year <= state.yearMax;
    return indOk && typeOk && yearOk;
  }).sort((a, b) => b.year - a.year || b.month - a.month);
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function monthName(m) {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] || '';
}

// ─── Init ─────────────────────────────────────────────────────────────────
updateRangeFill();
render();
