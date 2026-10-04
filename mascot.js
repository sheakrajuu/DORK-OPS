"use strict";

const mascotButtons = document.querySelectorAll(".mascot-button");
const adSlides = Array.from(document.querySelectorAll("[data-ad-slide]"));

mascotButtons.forEach((mascotButton) => {
  const mascotMessage = mascotButton.closest("[data-ad-slide]")?.querySelector(".mascot-message");
  if (!mascotMessage) return;

  const messages = mascotMessage.id === "mascot-contribute-message"
    ? [
      "Anyone is welcome to help improve Dork Ops.",
      "Contributions can include code, documentation, and accessibility fixes.",
      "Visit GitHub to report a bug or suggest an improvement."
    ]
    : [
      "A GitHub star helps other people discover Dork Ops.",
      "Found this tool useful? Star the project on GitHub.",
      "Stars are free and encourage more updates. Thanks for visiting!"
    ];
  let messageIndex = 0;

  const showNextMessage = () => {
    messageIndex = (messageIndex + 1) % messages.length;
    mascotMessage.textContent = messages[messageIndex];
  };

  mascotButton.addEventListener("click", showNextMessage);
  mascotButton.addEventListener("mouseenter", showNextMessage);
});

if (adSlides.length > 1) {
  let activeSlide = 0;

  const showSlide = (index) => {
    activeSlide = index;
    adSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeSlide;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });
  };

  showSlide(activeSlide);

  window.setInterval(() => {
    showSlide((activeSlide + 1) % adSlides.length);
  }, 6000);
}
