/* ============================================================
   La Piazza — script.js
   Fetches all recipes from DummyJSON API and renders them
   ============================================================ */

// ─── API Configuration ───────────────────────────────────────
const API_BASE = 'https://dummyjson.com';
const RECIPES_LIMIT = 30; // fetch up to 50 recipes

// ─── State ───────────────────────────────────────────────────
let allRecipes = [];
let activeFilter = 'all';
let searchQuery = '';


// ============================================================
// NAVBAR — scroll shadow & hamburger toggle
// ============================================================
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});


// ============================================================
// FETCH — Get all recipes from DummyJSON API
// ============================================================
async function fetchAllRecipes() {
  showLoading();

  try {
    // Fetch all recipes with a high limit — DummyJSON /recipes returns up to 50
    const response = await fetch(`${API_BASE}/recipes?limit=${RECIPES_LIMIT}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    allRecipes = data.recipes || [];

    // Update the hero stat with actual count
    document.getElementById('statRecipes').textContent = allRecipes.length + '+';

    renderRecipes();

  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    showError();
  }
}


// ============================================================
// RENDER — Filter, search, then build cards
// ============================================================
function renderRecipes() {
  let recipes = [...allRecipes];

  // Apply filter
  if (activeFilter === 'quick') {
    recipes = recipes.filter(recipe => {
      const total = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
      return total <= 30;
    });
  } else if (activeFilter === 'top') {
    recipes = recipes.filter(recipe => recipe.rating >= 4.5);
  }

  // Apply search query
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    recipes = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(query) ||
      (recipe.ingredients || []).some(ing => ing.toLowerCase().includes(query)) ||
      (recipe.cuisine || '').toLowerCase().includes(query)
    );
  }

  // Update results count
  updateResultsCount(recipes.length);

  // Render cards or empty state
  if (recipes.length === 0) {
    showNoResults();
  } else {
    renderCards(recipes);
  }
}


// ============================================================
// BUILD CARD HTML
// ============================================================
function buildCard(recipe, index) {
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  const rating = recipe.rating ? parseFloat(recipe.rating).toFixed(1) : null;
  const filledStars = recipe.rating ? Math.round(recipe.rating) : 0;
  const starsHTML = '★'.repeat(filledStars) + '☆'.repeat(5 - filledStars);
  const reviewCount = recipe.reviewCount || Math.floor(Math.random() * 200 + 40);
  const ingredients = recipe.ingredients || [];
  const shownIngredients = ingredients.slice(0, 3);
  const extraCount = ingredients.length - 3;
  const delay = (index % 6) * 0.07; // stagger animation

  // Image or placeholder
  const imgHTML = recipe.image
    ? `<img
        src="${recipe.image}"
        alt="${recipe.name}"
        loading="lazy"
        onerror="this.parentElement.innerHTML='<div class=\\'card-img-placeholder\\'>🍕</div>'"
       />`
    : `<div class="card-img-placeholder">🍕</div>`;

  // Difficulty badge
  const badgeHTML = recipe.difficulty
    ? `<div class="card-badge">${recipe.difficulty}</div>`
    : '';

  // Ingredient tags
  const tagHTML = shownIngredients
    .map(ing => `<span class="ingredient-tag">${ing.length > 22 ? ing.slice(0, 20) + '…' : ing}</span>`)
    .join('');

  const moreHTML = extraCount > 0
    ? `<span class="ingredient-more">+${extraCount} more</span>`
    : '';

  return `
    <div class="pizza-card" style="animation-delay: ${delay}s">
      <div class="card-img-wrap">
        ${imgHTML}
        ${badgeHTML}
      </div>
      <div class="card-body">
        <div class="card-cuisine">${recipe.cuisine || 'International'}</div>
        <div class="card-name">${recipe.name}</div>
        <div class="card-meta">
          <span class="meta-item">⏱ ${totalTime} min</span>
          <span class="meta-item">🍽 ${recipe.servings || 2} servings</span>
          <span class="meta-item">🔥 ${recipe.caloriesPerServing || '—'} kcal</span>
        </div>
        ${rating ? `
        <div class="card-rating">
          <span class="stars">${starsHTML}</span>
          <span class="rating-num">${rating}</span>
          <span class="rating-count">(${reviewCount} reviews)</span>
        </div>` : ''}
        <div class="card-ingredients">
          <div class="ingredients-label">Key Ingredients</div>
          <div class="ingredients-list">
            ${tagHTML}${moreHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}


// ============================================================
// DOM HELPERS
// ============================================================
function renderCards(recipes) {
  const grid = document.getElementById('pizzaGrid');
  grid.innerHTML = recipes.map((recipe, i) => buildCard(recipe, i)).join('');
}

function showLoading() {
  document.getElementById('pizzaGrid').innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-text">Fetching our finest recipes from the API…</div>
    </div>
  `;
  document.getElementById('resultsCount').textContent = '';
}

function showError() {
  document.getElementById('pizzaGrid').innerHTML = `
    <div class="error-state">
      <div class="error-icon">😕</div>
      <div class="error-text">Couldn't load recipes. Please check your connection.</div>
      <button class="btn-primary" onclick="fetchAllRecipes()">Try Again</button>
    </div>
  `;
}

function showNoResults() {
  document.getElementById('pizzaGrid').innerHTML = `
    <div class="no-results">🍕 No recipes match your search — try something else!</div>
  `;
}

function updateResultsCount(count) {
  const el = document.getElementById('resultsCount');
  if (count > 0) {
    el.textContent = `Showing ${count} recipe${count !== 1 ? 's' : ''}`;
  } else {
    el.textContent = '';
  }
}


// ============================================================
// FILTER BUTTONS
// ============================================================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active state
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update filter and re-render
    activeFilter = btn.dataset.filter;
    renderRecipes();
  });
});


// ============================================================
// SEARCH INPUT
// ============================================================
document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderRecipes();
});


// ============================================================
// INIT — Start the app
// ============================================================
fetchAllRecipes();
