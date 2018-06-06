/**
 * Table of course instances where the user is registered as a student
 * ex
  id(pin):  -- database id of the course
  name(pin): "Tietokantasovellus (periodi IV)" -- String, Name of the course
  start(pin):  -- Date, start date of the course
  end(pin):   -- date, end date of the course
  active(pin):  -- boolean, is the course active or not.
  weekAmount(pin): -- integer, how many weeks does the course have
  weekMaxPoints(pin): -- double, how many points does week have
  currentWeek(pin): -- integer, what is the current week
  ohid(pin): -- Opetushallitus id of the course, is often used instead of the database id
 */
import { sortCourses } from '../util/sort'

const studentInstancereducer = (store = [], action) => {
  switch (action.type) {
    case 'STUDENT_COURSE_GET_ALL_SUCCESS':
      return sortCourses(action.response)
    case 'STUDENT_COURSE_CREATE_ONE_SUCCESS':
      return action.response
    case 'STUDENT_PROJECT_INFO_UPDATE_SUCCESS':
      return action.response
    default:
      return store
  }
}

export default studentInstancereducer
