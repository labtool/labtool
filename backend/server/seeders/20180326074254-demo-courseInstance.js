

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.bulkInsert(
    'CourseInstances',
    [
      {
        id: 10011,
        name: 'Aineopintojen harjoitustyö: Tietorakenteet ja algoritmit (periodi IV)',
        start: '2018-03-11T21:00:00.000Z',
        end: '2018-04-29T21:00:00.000Z',
        active: true,
        weekAmount: 7,
        weekMaxPoints: 3,
        currentWeek: 1,
        currentCodeReview: [1, 2],
        amountOfCodeReviews: 2,
        ohid: 'TKT20010.2018.K.A.1',
        createdAt: '2018-03-26',
        updatedAt: '2018-03-26'
      },
      {
        id: 10012,
        name: 'Ohjelmistotekniikan menetelmät',
        start: '2018-03-11T21:00:00.000Z',
        end: '2018-04-29T21:00:00.000Z',
        active: true,
        weekAmount: 7,
        weekMaxPoints: 3,
        currentWeek: 1,
        currentCodeReview: [1, 2],
        amountOfCodeReviews: 2,
        ohid: 'TKT20002.2018.K.K.1',
        createdAt: '2018-03-26',
        updatedAt: '2018-03-26'
      },
      {
        id: 10013,
        name: 'Aineopintojen harjoitustyö: Tietokantasovellus (periodi III)',
        start: '2018-01-16T21:00:00.000Z',
        end: '2018-03-10T21:00:00.000Z',
        active: false,
        weekAmount: 7,
        weekMaxPoints: 3,
        currentWeek: 1,
        currentCodeReview: '{}',
        amountOfCodeReviews: 0,
        ohid: 'TKT20011.2018.K.A.1',
        createdAt: '2018-03-26',
        updatedAt: '2018-03-26'
      },
      {
        id: 10014,
        name: 'Aineopintojen harjoitustyö: Tietokantasovellus (alkukesä)',
        start: '2018-05-16T21:00:00.000Z',
        end: '2018-06-30T21:00:00.000Z',
        active: false,
        weekAmount: 7,
        weekMaxPoints: 3,
        currentWeek: 1,
        currentCodeReview: '{}',
        amountOfCodeReviews: 0,
        ohid: 'TKT20011.2018.V.K.1',
        createdAt: '2018-03-26',
        updatedAt: '2018-03-26'
      },
      {
        id: 10015,
        name: 'Aineopintojen harjoitustyö: Tietokantasovellus (loppukesä)',
        start: '2018-07-22T21:00:00.000Z',
        end: '2018-08-31T21:00:00.000Z',
        active: false,
        weekAmount: 7,
        weekMaxPoints: 3,
        currentWeek: 1,
        currentCodeReview: '{}',
        amountOfCodeReviews: 0,
        ohid: 'TKT20011.2018.V.K.2',
        createdAt: '2018-03-26',
        updatedAt: '2018-03-26'
      },
      {
        id: 10016,
        name: 'Aineopintojen harjoitustyö: Tietokantasovellus (vuodenvaihde)',
        start: '2018-12-16T21:00:00.000Z',
        end: '2018-01-31T21:00:00.000Z',
        active: false,
        weekAmount: 7,
        weekMaxPoints: 3,
        currentWeek: 1,
        currentCodeReview: '{}',
        amountOfCodeReviews: 0,
        ohid: 'TKT20011.2018.V.V.1',
        createdAt: '2018-03-26',
        updatedAt: '2018-03-26'
      }
    ],
    {}
  ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('CourseInstances', null, {})
}
