document.addEventListener("DOMContentLoaded", function () {
  const horaires = [
    { jours: [1, 2, 3, 4, 5, 6], ouverture: "07:30", fermeture: "12:30" },
    { jours: [1, 2, 3, 4, 5, 6], ouverture: "15:30", fermeture: "19:30" },
    { jours: [0], ouverture: "08:00", fermeture: "12:00" },
  ];

  let countdownInterval; // Stocke l'intervalle du compte à rebours

  function checkHoraire() {
    clearInterval(countdownInterval); // Stoppe un ancien compte à rebours actif

    const now = new Date();
    const jour = now.getDay();
    const heure = now.getHours();
    const minute = now.getMinutes();
    const seconde = now.getSeconds();
    const heureActuelle = heure * 60 + minute;
    const statutMagasin = document.getElementById("statut-magasin");

    let magasinOuvert = false;
    let tempsRestant = null;
    let message = "";

    horaires.forEach(({ jours, ouverture, fermeture }) => {
      if (jours.includes(jour)) {
        const [hOuv, mOuv] = ouverture.split(":").map(Number);
        const [hFerm, mFerm] = fermeture.split(":").map(Number);

        const ouvertureMin = hOuv * 60 + mOuv;
        const fermetureMin = hFerm * 60 + mFerm;

        if (heureActuelle >= ouvertureMin && heureActuelle < fermetureMin) {
          magasinOuvert = true;
        }

        // Vérifier si on est dans les 5 minutes avant ouverture/fermeture
        if (heureActuelle >= ouvertureMin - 5 && heureActuelle < ouvertureMin) {
          message = "Ouverture dans ";
          tempsRestant = (ouvertureMin - heureActuelle) * 60 - seconde;
        } else if (
          heureActuelle >= fermetureMin - 5 &&
          heureActuelle < fermetureMin
        ) {
          message = "Fermeture dans ";
          tempsRestant = (fermetureMin - heureActuelle) * 60 - seconde;
        }
      }
    });

    // Si un compte à rebours doit être affiché
    if (tempsRestant !== null) {
      function updateCountdown() {
        if (tempsRestant > 0) {
          const minutes = Math.floor(tempsRestant / 60);
          const secondes = tempsRestant % 60;
          statutMagasin.textContent =
            message + `${minutes}:${secondes < 10 ? "0" : ""}${secondes}`;
          tempsRestant--;
        } else {
          clearInterval(countdownInterval);
          statutMagasin.textContent = magasinOuvert
            ? "Le magasin est OUVERT"
            : "Le magasin est FERMÉ";
        }
      }

      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    } else {
      // Afficher normalement si aucun compte à rebours
      statutMagasin.textContent = magasinOuvert
        ? "Le magasin est OUVERT"
        : "Le magasin est FERMÉ";
    }
  }

  setInterval(checkHoraire, 1000); // Vérifie chaque seconde pour mise à jour fluide
  checkHoraire(); // Vérifie immédiatement au chargement de la page
});
