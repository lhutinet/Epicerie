// Injecte dynamiquement le contenu de nav.html
async function loadNavbar() {
  try {
    const response = await fetch("./nav.html"); // Assurez-vous que le chemin est correct
    if (!response.ok) {
      throw new Error(
        `Erreur de chargement de la navigation : ${response.status}`
      );
    }
    const navbarContent = await response.text();
    document.getElementById("navbar").innerHTML = navbarContent;

    // Réattache les gestionnaires d'événements après l'injection
    setupNavigationEvents();
    setupHamburgerMenu(); // Ajout de la fonction pour le hamburger menu
  } catch (error) {
    console.error("Erreur lors du chargement de la navigation :", error);
  }
}

// Fonction pour configurer les gestionnaires d'événements sur la navigation
function setupNavigationEvents() {
  document.querySelectorAll("nav a[data-category]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); // Empêche le comportement par défaut
      const category = event.target.getAttribute("data-category"); // Récupère la catégorie
      console.log("Catégorie sélectionnée :", category);

      // Redirige vers la page avec la catégorie en query string
      window.location.href = `./photos.html?category=${category}`;
    });
  });
}

// Fonction pour gérer l'événement du hamburger menu
function setupHamburgerMenu() {
  const hamburger = document.querySelector(".hamburger");
  const menu = document.querySelector("nav ul");
  const nav = document.querySelector("nav");

  if (hamburger && menu) {
    // Toggle menu au clic sur le bouton burger
    hamburger.addEventListener("click", function (event) {
      menu.classList.toggle("active");
      event.stopPropagation(); // Empêche la propagation pour éviter la fermeture immédiate
    });

    // Fermer le menu quand on clique ailleurs sur la page
    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
        menu.classList.remove("active");
      }
    });

    // Fermer le menu si on clique sur un lien à l'intérieur
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", function () {
        menu.classList.remove("active");
      });
    });
  }

  // Gérer le hover sur desktop (désactivé sur mobile)
  if (window.innerWidth > 768) {
    // Vérifie si on est sur un écran large (desktop)
    nav.addEventListener("mouseenter", () => {
      menu.classList.add("active");
    });

    nav.addEventListener("mouseleave", () => {
      menu.classList.remove("active");
    });
  }
}

// Charger la navigation avant la galerie

async function loadFooter() {
  try {
    const response = await fetch("./footer.html"); // Assurez-vous que le chemin est correct
    if (!response.ok) {
      throw new Error(
        `Erreur de chargement de la navigation : ${response.status}`
      );
    }
    const footerContent = await response.text();
    document.getElementById("footer").innerHTML = footerContent;

    // Réattache les gestionnaires d'événements après l'injection
  } catch (error) {
    console.error("Erreur lors du chargement de la navigation :", error);
  }
}
loadNavbar();
loadFooter();
