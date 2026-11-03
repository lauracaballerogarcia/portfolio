<p class="case-section__eyebrow">Context</p>

## Older adults are losing access to the leisure activities that keep them active and connected.

<!-- **Scope of work** -->
![Project timeline from September to January: UX research (initial hypothesis, desk research, proto-persona, benchmark, interviews), definition (validated hypothesis, problem statement, personas, user journey, concept, strategy), ideation (epics, user stories, flows, sitemap, wireframes, prototyping, usability testing) and UI design (branding, high-fidelity UI, design system, moderated testing).](/media/senda/senda-02-context-scope-of-work.webp "full 1024x480 expand")

**The brief**

> How might we help people aged 70+ access leisure activities more easily through a digital platform?

**Goal**

<div class="case-callout case-callout--goal">
  <span class="case-callout__icon" aria-hidden="true"></span>
  <p class="case-callout__text">Help older adults participate more independently in leisure activities while creating value for institutions and the wider community.</p>
</div>



<p class="case-section__eyebrow">Research</p>

## We assumed the problem was finding activities. Interviews with older adults proved us wrong 

This project arose from identifying the barriers this group faces in digital environments. The lack of accessible tools not only limits their autonomy but also their active participation in daily life.

Following an initial brainstorming session, we arrived at an initial hypothesis:

>People over the age of 70 with intellectual interests need a simple way to find affordable activities because they lack a common place they can turn to.

However, before moving into solution design, we needed to validate this assumption and understand the underlying problem.


### Understanding where digital processes break down

To address this, we needed a deep understanding of older adults' fears, the barriers they face with technology, and how they experience the digital divide. This involved collecting qualitative data through **in-person interviews** with older adults, which allowed us to gather first-hand insights into their behaviours, motivations, and pain points.
![Three quotes from interviews with older adults. Mari Carmen, 74: “I prefer to call to make a reservation. If I have to do it online, I call my daughter because I’m not sure how.” Araceli, 73: “I always buy at the ticket office, I don’t know about mobile… I’d like to know how to manage it better and not have to move around so much.” Miguel, 72: “With so many people scamming you these days, I’m scared and I prefer not to take the risk.”](/media/senda/senda-03-research-quotes.webp "full 1024x496 expand")

### Insights
The findings revealed several key insights, including fear of scams, reliance on family members, digital exclusion, and the loss of opportunities and well-being.

<section class="insights" aria-label="Key insights">
  <ul class="insights__track" id="insightsTrack" tabindex="0">
    <li class="insight-card">
      <p class="insight-card__label">Digital exclusion</p>
      <div class="insight-card__content">
        <div class="insight-card__stat">
          <p class="insight-card__percentage">90%</p>
          <img class="insight-card__icon" src="/media/senda/senda-03-research-percentage-90.svg" alt="" width="101" height="80">
        </div>
        <p class="insight-card__description">
          Think that technology is not for them and feel that the world is moving too fast.
        </p>
      </div>
    </li>
    <li class="insight-card">
      <p class="insight-card__label">Fear of scams</p>
      <div class="insight-card__content">
        <div class="insight-card__stat">
          <p class="insight-card__percentage">82%</p>
          <img class="insight-card__icon" src="/media/senda/senda-03-research-percentage-82.svg" alt="" width="160" height="36">
        </div>
        <p class="insight-card__description">
          Feel insecure and exposed when making online payments due to the numerous scams.
        </p>
      </div>
    </li>
    <li class="insight-card">
      <p class="insight-card__label">Dependency</p>
      <div class="insight-card__content">
        <div class="insight-card__stat">
          <p class="insight-card__percentage">76%</p>
          <img class="insight-card__icon" src="/media/senda/senda-03-research-percentage-76.svg" alt="" width="160" height="80">
        </div>
        <p class="insight-card__description">
          Depend on family members or third parties to carry out complex digital actions.
        </p>
      </div>
    </li>
    <li class="insight-card">
      <p class="insight-card__label">Loss of social opportunities and well-being</p>
      <div class="insight-card__content">
        <div class="insight-card__stat">
          <p class="insight-card__percentage">78%</p>
          <img class="insight-card__icon" src="/media/senda/senda-03-research-percentage-78.svg" alt="" width="161" height="97">
        </div>
        <p class="insight-card__description">
          Lose out on social well-being opportunities by being unable to afford certain online procedures.
        </p>
      </div>
    </li>
  </ul>

  <div class="insights__controls">
    <button class="icon-button insights__arrow" data-scroll="prev" aria-label="Show previous insight">
      <!-- SVG flecha izquierda aquí, con aria-hidden="true" -->
    </button>
    <button class="icon-button insights__arrow" data-scroll="next" aria-label="Show next insight">
      <!-- SVG flecha derecha aquí, con aria-hidden="true" -->
    </button>
  </div>
</section>

Together, these observations pointed towards a broader need: making complex digital processes feel simpler, safer, and more manageable.


<p class="case-section__eyebrow">Problem</p>

## It was never about finding activities — it was about feeling safe enough to pay for them
The insights showed that the real challenge wasn't finding or signing up for leisure activities, but feeling secure while paying online for them. Users knew where to look for activities that interested them, but the digital payment step was a major setback. 
![Before and after diagram. Before, the MVP covered three opportunities: access to training activities, simpler complex processes and personalised support. After, it narrows to one: simplifying online payments, because if seniors don’t feel confident paying, that has to be solved first.](/media/senda/senda-04-problem-strategic-shift.webp "full 1024x497 expand")

This led us to reframe the original hypothesis into the real problem to solve:

>People over the age of 70 need to make online payments securely, but they do not trust entering their bank card details online and lack simple alternatives that make them feel safe and confident.

From this reframed problem, we devised guided solutions, simplified steps, and a more empathetic tone.




<p class="case-section__eyebrow">Solution</p>

## A digital wallet that keeps their main bank account out of the equation

Senda offers an alternative approach to online payments through a digital wallet that can be topped up via the app — by requesting a transfer from a family member or caregiver — or in person at a trusted local store regularly visited by the user. This enables older adults to pay for their own leisure activities without exposing their main bank account or navigating complex banking environments.

### Every interaction was designed to reduce uncertainty
Based on our research insights, we defined three core design principles that guided every design decision, ensuring the final experience was tailored to users' needs:
> Empathetic  – Nimble – Reliable


### We focused the <abbr title="Minimum Viable Product">MVP</abbr> on the moments where confidence matters most

#### Key features
Before designing the user flows, we identified three key features that would shape the user experience: secure payments, hybrid top-ups, and trusted support. These served as the foundation for the app's overall functionality.

![Three key features: safe payments with a limited balance that keeps bank and card details protected; hybrid top-ups, either requested digitally or made in person at trusted locations; and trusted support, receiving funds from approved family members with full transparency.](/media/senda/senda-05-solution-key-features.webp "full 785x424 expand")

#### User Roles
We defined two user roles: the Senior, who uses the app to make payments, and the Administrator, a trusted family member or caregiver responsible for managing and topping up the senior's balance. For the <abbr title="Minimum Viable Product">MVP</abbr>, we prioritized the Senior experience, as it represented the app's primary user journey.

![Main user, the senior: low digital confidence, fear of scams, needs reassurance and clarity.](/media/senda/senda-05-solution-user-role-primary.webp "half 383x296")
![Secondary user, the administrator: higher digital literacy, needs control and oversight, wants security and transparency.](/media/senda/senda-05-solution-user-role-secondary.webp "half 383x296")


#### Initial mapping
The next step was mapping the happy path for senior users making a payment. We started with the wallet top-up, as it represented users' first interaction with the payment experience and the stage where friction or uncertainty was most likely to occur. It was essential that this initial flow clearly communicated security and built users' confidence from the outset.

![Happy-path flow for topping up the wallet. A user with no balance chooses how to top up: at a physical location, with an introduction, a top-up animation and an updated balance; or by requesting money from an admin, choosing an amount, optionally adding a message, confirming and waiting for approval, followed by a notification.](/media/senda/senda-05-solution-sitemap.webp "full 1600x800 expand")



<p class="case-section__eyebrow">Testing</p>

## The core flow worked, but physical top-ups created friction

### Test Objectives
1. Evaluate the usability of the main features
2. Identify what users would do if they needed help with any process.
3. Identify which areas users interpret as clickable (e.g., the cards in the list of physical locations or the wallet in the request flow).
4. Identify whether users would like Senda to provide GPS-like guidance to help them locate the selected physical points.

### User Testing with maze
Testing was conducted remotely via Maze. The study involved two participant groups*: 11 users (people over 70 with difficulties making online payments) and 14 admins (caregivers who assist elderly users with digital tasks).

<div class="case-note" role="note">
  <p class="case-note__text case-note__label">Note:</p>
  <p class="case-note__text">*While the 25-person sample served as a solid exploratory foundation, a statistically representative sample would require 385 participants (5% margin of error, 95% confidence level) to draw conclusive findings at scale.</p>
</div>

![Maze heatmaps on four prototype screens (wallet, request balance, request summary and physical top-up) showing where participants tapped.](/media/senda/senda-06-testing-maze.webp "full 785x420 expand")

Heatmaps revealed where users tapped during usability testing, helping us assess whether they could easily identify the intended path. They also exposed interaction patterns and areas of confusion, such as misclicks and instances where users selected the wrong element.

### Evaluation

- Users are able to request balance without complications.
- Users have difficulties when topping up at physical locations.
- Users had difficulties finding nearby physical locations.
- Administrators experienced difficulties when approving a top-up request.


### Iteration & refinement
Based on these insights, we identified several improvements before moving into the final <abbr title="Minimum Viable Product">MVP</abbr> UI:

1. Redesigning the physical recharge flow to reduce misclicks and improve interaction clarity.
2. Strengthening UI visuals so tappable elements were more obvious.
3. Introducing an optional "Get directions" button to support real-world navigation.
4. Adding an assistance flow so users could quickly access help when uncertain.


#### Final MVP User Flow

![Final MVP flow for requesting balance through the app: from the home screen, the user picks an amount, adds an optional message, confirms the request and sees that it has been sent. A branch shows cancelling, with a dialog to confirm or go back.](/media/senda/senda-06-testing-final-flow-1.webp "full 1981x1470 expand | Final MVP flow for requesting balance through the app: from the home screen, the user picks an amount, adds an optional message, confirms the request and sees that it has been sent. A branch shows cancelling, with a dialog to confirm or go back")


<p class="case-section__eyebrow">Outcome</p>

## A simpler payment experience built around trust


### Final UI

![An older man holding a phone that shows Senda’s nearest top-up points on a map, with a notification confirming a 30 EUR top-up at a local tobacconist.](/media/senda/senda-07-outcome-final-ui-physical-top-up.webp "full 1024x569")

![Senda’s visual identity: Antonia and Onest typefaces, a dark green, light green and light blue palette, the app icon, a wallet illustration, a map route to a bank and the request summary screen on a phone.](/media/senda/senda-07-outcome-final-ui-visual-identity.webp "full 2048x1269")

![Animated home screen where the user switches their wallet between green, dark green and blue.](/media/senda/senda-outcome-final-ui-wallets.mp4 "full 1440x932")

### Final prototype

#### Request top-up with cash flow
![Senda splash screen: a hand holding a coin, with the line “Your money. Your peace of mind. Your pace.”](/media/senda/senda-outcome-prototype-flow-request-top-up.webp "half 383x480")
![Senda splash screen: a hand holding a coin, with the line “Your money. Your peace of mind. Your pace.”](/media/senda/senda-outcome-prototype-flow-request-top-up.webp "half 383x480")


#### Request balance to admin flow
![Senda splash screen: a hand holding a coin, with the line “Your money. Your peace of mind. Your pace.”](/media/senda/senda-outcome-prototype-flow-request-top-up.webp "half 383x480")
![Senda splash screen: a hand holding a coin, with the line “Your money. Your peace of mind. Your pace.”](/media/senda/senda-outcome-prototype-flow-request-top-up.webp "half 383x480")

### Next steps
1. Introduce a brief, task-oriented onboarding.
2. Add an optional "How to get there" flow for physical locations.
3. Develop the administrator interface.




<p class="case-section__eyebrow">Reflection</p>

## Designing for confidence means designing beyond the interface

### Projected impact
 
<ol class="case-impact">
  <li class="case-impact__card">
    <h4 class="case-impact__title">Reducing digital gap and distrust</h4>
    <p class="case-impact__text">Current interfaces are not designed for older users; Senda, in contrast, offers an experience tailored to their needs, building trust.</p>
  </li>
  <li class="case-impact__card">
    <h4 class="case-impact__title">Increasing initiative in online processes</h4>
    <p class="case-impact__text">By removing confusion and simplifying steps, users become less afraid of making mistakes and are more willing to engage with technology.</p>
  </li>
  <li class="case-impact__card">
    <h4 class="case-impact__title">Promoting well-being and inclusion</h4>
    <p class="case-impact__text">We enable access to a wide range of activities and experiences for a key user group.</p>
  </li>
</ol>

<div class="case-note" role="note">
  <p class="case-note__text case-note__label">Note:</p>
  <p class="case-note__text">As part of an academic project, the solution was not validated after launch. In a real-world scenario, success would be measured through metrics such as task completion rate, time on task, user confidence and satisfaction, and increased adoption of digital payments among older adults.</p>
</div>


### Takeaways

<ol class="case-accordion case-accordion--numbered">
  <li class="case-accordion__item">
    <details class="case-accordion__details">
      <summary class="case-accordion__summary">Tool choice and test structure impact data quality</summary>
      <p class="case-accordion__text">The choice of Maze, and the way tasks and questions were structured, had a direct impact on the usability test results. The extra interface layer introduced additional cognitive load, making it harder to isolate issues in the product itself. In hindsight, a moderated in-person usability test would have provided clearer behavioural insights and a more natural testing environment.</p>
    </details>
  </li>
  <li class="case-accordion__item">
    <details class="case-accordion__details">
      <summary class="case-accordion__summary">Copywriting directly shapes user understanding and flow</summary>
      <p class="case-accordion__text">Microcopy played a key role in how users interpreted actions and navigated the interface. Even small wording choices influenced comprehension and decision-making, with unclear or technical language often leading to confusion during key tasks. Clear, concise copy proved essential to reduce friction, especially for less digitally experienced users.</p>
    </details>
  </li>
  <li class="case-accordion__item">
    <details class="case-accordion__details">
      <summary class="case-accordion__summary">Confirmation screens build confidence and reduce errors</summary>
      <p class="case-accordion__text">Confirmation states were crucial in reinforcing user confidence throughout the experience. By clearly signalling that an action had been completed, they reduced uncertainty and prevented unnecessary repetition or hesitation. This was especially important for users with lower digital confidence, making flows feel more reliable and predictable.</p>
    </details>
  </li>
</ol>