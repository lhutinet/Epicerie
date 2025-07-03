// const --- = document.querySelector("---");
// const --- = document.getElementById("---");
// window.addEventListener("---", () => {----});

// test
// window.addEventListener("click", (e) => {
//   console.log(e.target);
// });
// ----------fetch-----------------------
// let testData = [];

// const fetchTeset = async () => {
//   await fetch(" https://restcountries.com/v3.1/all")
//     .then((res) => res.json())
//     .then((data) => (testData = data));
//   console.log(testData);
// };

// fetchTeset();

// ----------fetch-----------------------
// partie a supprimée
document.addEventListener("DOMContentLoaded", function () {
  const targets = document.querySelectorAll(".animated-div");

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (entry.target.id === "myDivLeft") {
          entry.target.classList.add("animate-left");
        } else if (entry.target.id === "myDivRight") {
          entry.target.classList.add("animate-right");
        } else if (entry.target.id === "myDivOpacity") {
          entry.target.classList.add("animate-opacity");
        }
        observer.unobserve(entry.target);
      }
    });
  });

  targets.forEach((target) => {
    observer.observe(target);
  });
});
