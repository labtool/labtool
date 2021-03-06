const { User, CourseInstance, TeacherInstance, StudentInstance, CodeReview } = require('../models')
const helper = require('../helpers/usersControllerHelper')
const logger = require('../utils/logger')

function invalidInputResponse(res, error) {
  res.status(400).send({ error })
}

module.exports = {
  /**
   * Update the user that is making the request, changing email for now
   *   permissions: any logged in user
   *
   * @param req
   * @param res
   * @returns {*}
   */
  updateSelf(req, res) {
    if (!helper.controllerBeforeAuthCheckAction(req, res)) {
      return
    }

    if (!req.body.email || req.body.email.length < 1) {
      invalidInputResponse(res, 'Email was too short.')
    } else if (req.body.email.length > 127) {
      // 127 is an arbitrary limit, but there has to be some limit to avoid problems with the database.
      invalidInputResponse(res, 'Email was too long.')
    } else if (!req.body.email.includes('@')) {
      // This doesn't actually check for email validity, but it's a start.
      invalidInputResponse(res, 'Input was not a valid email address.')
    } else {
      User.update({ email: req.body.email }, { where: { id: req.decoded.id } }).then(
        User.findByPk(req.decoded.id)
          .then((user) => {
            const returnedUser = {
              email: req.body.email,
              firsts: user.firsts,
              lastname: user.lastname,
              studentNumber: user.studentNumber,
              username: user.username
            }
            res.status(201).send(returnedUser)
          })
          .catch((error) => {
            res.status(400).send(error)
            logger.error('User update error.', { error: error.message })
          })
      )
    }
  },

  /**
   * Update any other user, used to assign or remove admins.
   *   permissions: must be an admin
   *
   * @param req
   * @param res
   * @returns {*}
   */
  async updateAdmin(req, res) {
    if (!helper.controllerBeforeAuthCheckAction(req, res)) {
      return
    }
    const isAdmin = await helper.isAuthUserAdmin(req.decoded.id)
    if (!isAdmin) {
      return res.status(403).send('You must be a sysop.')
    }
    if (!req.body.id) {
      return res.status(400).send('You must provide a user ID.')
    }

    const user = await User.findOne({
      where: {
        id: req.body.id
      }
    })

    if (!user) {
      return res.status(400).send('User not found.')
    }

    const updatedUser = await user.update({
      sysop: req.body.sysop !== undefined ? req.body.sysop : user.sysop
    })
    res.status(200).send(updatedUser)
  },

  /**
   * List all users in the system
   *   permissions: must be an admin, or a teacher/an instructor on any course
   *
   * @param req
   * @param res
   * @returns {Promise<Array<Model>>}
   */
  async list(req, res) {
    if (!helper.controllerBeforeAuthCheckAction(req, res)) {
      return
    }

    if (req.authenticated.success) {
      try {
        // Make sure only teachers can get user list.
        const teacherInstances = await TeacherInstance.count({
          where: {
            userId: req.decoded.id
          }
        })
        const isAdmin = await helper.isAuthUserAdmin(req.decoded.id)

        if (!teacherInstances && !isAdmin) {
          return res.status(401).send('Unauthorized.')
        }

        const users = await User.findAll({
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'studentNumber']
          }
        })
        res.status(200).send(users)
      } catch (exception) {
        logger.error('User list error.', { error: exception.message })
        res.status(400).send('Unable to send user list.')
      }
    }
  },

  /**
   * Add an assistant to a course
   *   permissions: must be an admin, or a teacher/an instructor on the course
   *
   * @param {*} req
   * @param {*} res
   */
  async createTeacher(req, res) {
    if (!helper.controllerBeforeAuthCheckAction(req, res)) {
      return
    }

    if (req.authenticated.success) {
      try {
        // Make sure only teachers/assistants can add new teachers/assistants.
        const courseInstance = await CourseInstance.findOne({
          where: {
            ohid: req.body.ohid
          }
        })
        const teacherInstances = await TeacherInstance.count({
          where: {
            userId: req.decoded.id,
            courseInstanceId: courseInstance.id
          }
        })
        const isAdmin = await helper.isAuthUserAdmin(req.decoded.id)
        if (!teacherInstances && !isAdmin) {
          return res.status(400).send('You must be a teacher on the course to add assistants.')
        }

        const userToAssistant = await User.findByPk(req.body.id)
        const courseToAssist = courseInstance

        if (!userToAssistant || !courseToAssist) {
          return res.status(400).send('User or course not found.')
        }

        const alreadyExistingTeacherInstanceCount = await TeacherInstance.count({
          where: {
            userId: userToAssistant.id,
            courseInstanceId: courseToAssist.id
          }
        })
        if (alreadyExistingTeacherInstanceCount > 0) {
          return res.status(400).send('This user is already a teacher.')
        }

        const assistant = await TeacherInstance.create({
          userId: userToAssistant.id,
          courseInstanceId: courseToAssist.id,
          instructor: true
        })
        res.status(200).send(assistant)
      } catch (exception) {
        res.status(400).send('Error in creating teacher/assistant.')
      }
    }
  },

  /**
   * Remove an assistant to a course
   *   permissions: must be an admin, or a teacher/an instructor on the course
   *
   * @param {*} req
   * @param {*} res
   * @returns {Promise<*|Promise<T>>}
   */
  async removeTeacher(req, res) {
    if (!helper.controllerBeforeAuthCheckAction(req, res)) {
      return
    }

    if (req.authenticated.success) {
      try {
        const teacherToRemoveAsUser = await User.findByPk(req.body.id)
        const courseInstance = await CourseInstance.findOne({
          where: {
            ohid: req.body.ohid
          }
        })

        if (!teacherToRemoveAsUser || !courseInstance) {
          return res.status(400).send('User or course not found.')
        }

        // Make sure only teachers/assistants can remove assistants.
        const teacherInstances = await TeacherInstance.count({
          where: {
            userId: req.decoded.id,
            courseInstanceId: courseInstance.id
          }
        })
        const isAdmin = await helper.isAuthUserAdmin(req.decoded.id)
        if (!teacherInstances && !isAdmin) {
          return res.status(400).send('You must teach or assist on the course to remove assistants.')
        }

        const teacherInstanceToRemove = await TeacherInstance.findOne({
          where: {
            userId: teacherToRemoveAsUser.id,
            courseInstanceId: courseInstance.id
          }
        })
        if (!teacherInstanceToRemove) {
          return res.status(400).send('This user is not a teacher.')
        }

        // Make sure teachers responsible for the course cannot be removed.
        if (teacherInstanceToRemove.admin) {
          return res.status(400).send('Only assistants can be removed.')
        }

        await teacherInstanceToRemove.destroy()

        res.status(200).send(teacherInstanceToRemove)
      } catch (exception) {
        res.status(400).send('Error removing assistant.')
      }
    }
  },

  async removeStudent(req, res) {
    if (!helper.controllerBeforeAuthCheckAction(req, res)) {
      return
    }
    if (req.authenticated.success) {
      try {
        const userId = req.decoded.id

        const siToRemove = await StudentInstance.findOne({
          raw: true,
          where: {
            id: req.body.id
          }
        })
        if (!siToRemove) {
          return res.status(400).send('The student instance does not exist.')
        }

        const teacher = await TeacherInstance.findOne({
          where: {
            userId: req.decoded.id,
            courseInstanceId: siToRemove.courseInstanceId
          }
        })
        if (siToRemove.userId !== userId && !teacher) {
          return res.status(403).send('You must be the student himself or the teacher of the course to remove this student instance.')
        }
        if (siToRemove.validRegistration) {
          return res.status(400).send('The student instance can be removed only when his validRegistration has been marked as false.')
        }

        await StudentInstance.destroy({
          where: {
            id: req.body.id
          }
        })
        res.status(200).send('The student instance was deleted.')
      } catch (exception) {
        res.status(400).send('Error when removing the student.')
      }
    }
  }

}
