import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

describe('Side navigation: Cluster links', { tags: ['@navigation', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();

    HomePagePo.goTo();
    const burgerMenuPo = new BurgerMenuPo();

    burgerMenuPo.goToCluster('local');
  });

  it('Should access to every navigation provided from the server link, including nested cases, without errors', () => {
    const productNavPo = new ProductNavPo();
    const visitEach = (links: () => Cypress.Chainable) => {
      links().each((link, idx) => {
        links().eq(idx)
          .click({ force: true })
          .then((linkEl) => cy.url().should('contain', linkEl.prop('href')));
      });
    };

    visitEach(() => productNavPo.ungroupedNavTypes());

    // iterate through top-level groups
    productNavPo.groups().each((_, index) => {
      const group = productNavPo.groups().eq(index);

      // Select and expand current top-level group
      group.click();
      // check if it has sub-groups and expand them
      productNavPo.groups().eq(index).then(($group) => {
        // Expand any nested sub-groups within THIS group so their links render for the navigation
        // check below. Scope with `.find` rather than `cy.get`, which ignores the wrapped group and
        // would grab every nested accordion on the page. Scroll each header into view before clicking
        // it: a lower sub-group can sit below the nav's scroll fold and would otherwise be reported as
        // clipped by the scroll container. Clicking a group header only ever expands it (never
        // collapses), so this is safe to run over every nested sub-group.
        if ($group.find('.accordion.has-children').length) {
          cy.wrap($group).find('.accordion.has-children > .accordion-item > .header').each(($header) => {
            cy.wrap($header).scrollIntoView().should('be.visible')
              .click();
          });
        }
        // ensure group is expanded
        cy.wrap($group).find('ul').should('have.length.gt', 0);
      });

      // Visit each link of this group and confirm the app has navigated to that location
      visitEach(() => productNavPo.groupNavTypes(index));
    });
  });
});
