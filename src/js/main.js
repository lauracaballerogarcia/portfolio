const name = 'world';
console.log(`Hello ${name}`);




// DETAILS

const details = document.querySelectorAll("details");

details.forEach((detail) => {
  const summary = detail.querySelector("summary");

  detail.addEventListener("toggle", () => {
    if (detail.open) {
      summary.textContent = "Read less";
    } else {
      summary.textContent = "Read more";
    }
  });
});