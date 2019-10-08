import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Accordion, Button, Table, Card, Input, Form, Comment, Header, Label, Message, Icon, Popup, Loader, Dropdown, Grid, Segment } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { createOneComment } from '../../services/comment'
import { getOneCI, coursePageInformation } from '../../services/courseInstance'
import ReactMarkdown from 'react-markdown'
import { getAllTags, tagStudent, unTagStudent } from '../../services/tags'
import { associateTeacherToStudent } from '../../services/assistant'
import { addLinkToCodeReview } from '../../services/codeReview'
import { sendEmail } from '../../services/email'
import { coursePageReset, updateActiveIndex, toggleCodeReview, selectTag, selectTeacher } from '../../reducers/coursePageLogicReducer'
import { updateStudentProjectInfo } from '../../services/studentinstances'
import { resetLoading } from '../../reducers/loadingReducer'

import LabtoolComment from '../LabtoolComment'
import LabtoolAddComment from '../LabtoolAddComment'
import StudentTable from '../StudentTable'
import { createDropdownTeachers, createDropdownTags } from '../../util/dropdown'

const CoursePageHeader = ({ courseInstance }) => (
  <Header as="h2" style={{ marginBottom: '1em' }}>
    <Header.Content>
      {courseInstance.name}
      <Header.Subheader>
        {courseInstance.coursesPage && <a href={courseInstance.coursesPage}>courses.helsinki.fi</a>} {courseInstance.coursesPage && courseInstance.courseMaterial && '|'}{' '}
        {courseInstance.courseMaterial && <a href={courseInstance.courseMaterial}>Course material</a>}
      </Header.Subheader>
    </Header.Content>
  </Header>
)

CoursePageHeader.propTypes = {
  courseInstance: PropTypes.object.isRequired
}

export const CoursePage = props => {
  useEffect(() => {
    // run on component mount
    props.resetLoading()
    props.getOneCI(props.courseId)
    props.coursePageInformation(props.courseId)
    props.getAllTags()

    return () => {
      // run on component unmount
      props.coursePageReset()
    }
  }, [])

  const sortArrayAscendingByDate = theArray => {
    return theArray.sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  }

  const handleClick = (e, titleProps) => {
    const { index } = titleProps
    const theNewIndex = props.coursePageLogic.activeIndex === index ? -1 : index
    props.updateActiveIndex(theNewIndex)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const content = {
      hidden: false,
      comment: e.target.content.value,
      week: parseInt(e.target.name, 10),
      from: props.user.user.username
    }
    document.getElementById(e.target.name).reset()
    try {
      await props.createOneComment(content)
      document.getElementById('comment').reset()
    } catch (error) {
      console.log(error)
    }
  }

  const handleAddingIssueLink = (reviewNumber, studentInstance) => async e => {
    e.preventDefault()
    const data = {
      reviewNumber,
      studentInstanceId: studentInstance,
      linkToReview: e.target.reviewLink.value
    }
    e.target.reviewLink.value = ''
    props.addLinkToCodeReview(data)
  }

  const droppedTagExists = () => {
    return props.tags.tags && props.tags.tags.map(tag => tag.name.toUpperCase()).includes('DROPPED')
  }

  const droppedStudentExists = () => {
    let dropped = props.courseData.data.map(student => student.dropped)
    return dropped.includes(true)
  }

  const hasDroppedTag = studentTagsData => {
    let studentInstanceTagNames = studentTagsData.map(tag => tag.name.toUpperCase())
    return studentInstanceTagNames.includes('DROPPED')
  }

  const markAllWithDroppedTagAsDropped = async courseData => {
    if (
      !window.confirm(
        'Confirming will mark the students with a dropped tag as dropped out. If a different tag was being used, the system will not suggest an automatic change. In that case, you need to change the status manually in the review page of that student. Are you sure you want to confirm?'
      )
    ) {
      return
    }
    for (let i = 0; i < courseData.data.length; i++) {
      let student = courseData.data[i]
      let studentTags = student.Tags
      if (hasDroppedTag(studentTags) === true) {
        handleMarkAsDropped(true, student.User.id)
      }
    }
  }

  const handleMarkAsDropped = async (dropped, id) => {
    props.updateStudentProjectInfo({
      ohid: props.selectedInstance.ohid,
      userId: id,
      dropped: dropped
    })
  }

  const sendEmail = commentId => async () => {
    props.sendEmail({
      commentId,
      role: 'student'
    })
  }

  const changeSelectedTeacher = () => {
    return (e, data) => {
      const { value } = data
      props.selectTeacher(value)
    }
  }

  const changeSelectedTag = () => {
    return (e, data) => {
      const { value } = data
      props.selectTag(value)
    }
  }

  const bulkDoAction = action => {
    const selectedStudents = props.coursePageLogic.selectedStudents
    const studentIds = Object.keys(selectedStudents).filter(key => selectedStudents[key])
    studentIds.forEach(action)
  }

  const bulkAddTag = () => {
    bulkDoAction(id => {
      const data = {
        studentId: id,
        tagId: props.coursePageLogic.selectedTag
      }
      props.tagStudent(data)
    })
  }

  const bulkRemoveTag = () => {
    bulkDoAction(id => {
      const data = {
        studentId: id,
        tagId: props.coursePageLogic.selectedTag
      }
      props.unTagStudent(data)
    })
  }

  const bulkUpdateTeacher = () => {
    let teacherId = props.coursePageLogic.selectedTeacher
    if (teacherId === '-') {
      // unassign
      teacherId = null
    }
    bulkDoAction(id => {
      const data = {
        studentInstanceId: id,
        teacherInstanceId: teacherId
      }
      props.associateTeacherToStudent(data)
    })
  }

  const bulkMarkDroppedBool = dropped => {
    bulkDoAction(id => {
      const student = props.courseData.data.find(data => data.id === Number(id))
      if (student) {
        handleMarkAsDropped(dropped, student.User.id)
      }
    })
  }

  const bulkMarkNotDropped = () => {
    bulkMarkDroppedBool(false)
  }

  const bulkMarkDropped = () => {
    bulkMarkDroppedBool(true)
  }

  let dropDownTeachers = []
  dropDownTeachers = createDropdownTeachers(props.selectedInstance.teacherInstances, dropDownTeachers)

  let dropDownTags = []
  dropDownTags = createDropdownTags(props.tags.tags, dropDownTags)

  if (props.loading.loading) {
    return <Loader active />
  }

  const renderComment = comment => {
    /* This hack compares user's name to comment.from and hides the email notification button when they don't match. */
    const userIsCommandSender = comment.from.includes(props.user.user.firsts) && comment.from.includes(props.user.user.lastname)

    return <LabtoolComment key={comment.id} comment={comment} allowNotify={userIsCommandSender} sendCommentEmail={sendEmail(comment.id)} />
  }

  const createStudentGradedWeek = (i, week) => (
    <Accordion key={i} fluid styled>
      <Accordion.Title active={i === props.coursePageLogic.activeIndex} index={i} onClick={handleClick}>
        <Icon name="dropdown" />
        {i + 1 > props.selectedInstance.weekAmount ? <span>Final Review</span> : <span>Week {week.weekNumber}</span>}, points {week.points}
      </Accordion.Title>
      <Accordion.Content active={i === props.coursePageLogic.activeIndex}>
        <Card fluid color="yellow">
          <Card.Content>
            <h4> Points {week.points} </h4>
            <h4> Feedback </h4>
            <ReactMarkdown>{week.feedback}</ReactMarkdown>{' '}
          </Card.Content>
        </Card>
        <h4> Comments </h4>
        <Comment.Group>{week ? sortArrayAscendingByDate(week.comments).map(renderComment) : <h4> No comments </h4>}</Comment.Group>
        <LabtoolAddComment weekId={week.id} handleSubmit={handleSubmit} />
      </Accordion.Content>
    </Accordion>
  )

  const createStudentUngradedWeek = i => (
    <Accordion key={i} fluid styled>
      <Accordion.Title active={props.coursePageLogic.activeIndex === i} index={i} onClick={handleClick}>
        <Icon name="dropdown" /> {i + 1 > props.selectedInstance.weekAmount ? <span>Final Review</span> : <span>Week {i + 1}</span>}
      </Accordion.Title>
      <Accordion.Content active={props.coursePageLogic.activeIndex === i}>
        <h4> Not Graded </h4>
        <h4> No comments </h4>
      </Accordion.Content>
    </Accordion>
  )

  const createStudentCodeReview = (i, cr) => (
    <Accordion key={i} fluid styled>
      <Accordion.Title className="codeReview" active={props.coursePageLogic.activeIndex === i || cr.points === null} index={i} onClick={handleClick}>
        <Icon name="dropdown" /> Code Review {cr.reviewNumber} {cr.points !== null ? ', points ' + cr.points : ''}
      </Accordion.Title>
      <Accordion.Content active={props.coursePageLogic.activeIndex === i || cr.points === null}>
        <div className="codeReviewExpanded">
          <div className="codeReviewPoints">
            <strong>Points: </strong> {cr.points !== null ? cr.points : 'Not graded yet'}
            <br /> <br />
            <strong>Project to review: </strong>
            {cr.toReview.projectName}
            <br />
            <strong>GitHub: </strong>
            <a href={cr.toReview.github} target="_blank" rel="noopener noreferrer">
              {cr.toReview.github}
            </a>
            <br /> <br />
            {cr.linkToReview ? (
              <div>
                <strong>Your review: </strong>
                <a href={cr.linkToReview} target="_blank" rel="noopener noreferrer">
                  {cr.linkToReview}
                </a>
              </div>
            ) : (
              <div />
            )}
          </div>

          {props.coursePageLogic.showCodeReviews.indexOf(cr.reviewNumber) !== -1 ? (
            <div>
              {cr.linkToReview ? (
                <div />
              ) : (
                <div>
                  <strong>Link your review here:</strong> <br />
                  <Form onSubmit={handleAddingIssueLink(cr.reviewNumber, props.courseData.data.id)}>
                    <Form.Group inline>
                      <Input
                        type="text"
                        name="reviewLink"
                        icon="github"
                        required={true}
                        iconPosition="left"
                        style={{ minWidth: '25em' }}
                        placeholder="https://github.com/account/repo/issues/number"
                        className="form-control1"
                      />
                    </Form.Group>
                    <Form.Group>
                      <Button compact type="submit" color="blue">
                        Submit
                      </Button>
                    </Form.Group>
                  </Form>
                </div>
              )}
            </div>
          ) : (
            <p />
          )}
        </div>
      </Accordion.Content>
    </Accordion>
  )

  const renderStudentBottomPart = () => {
    let headers = []
    // studentInstance is id of student. Type: String
    // Tämä pitää myös korjata.

    // student's own details.
    headers.push(
      <div key="student info">
        {props.courseData && props.courseData.data && props.courseData.data.User ? (
          <Card key="card" fluid color="yellow">
            <Card.Content>
              <h2>
                {props.courseData.data.User.firsts} {props.courseData.data.User.lastname}
              </h2>
              <h3> {props.courseData.data.projectName} </h3>
              <h3>
                <a href={props.courseData.data.github} target="_blank" rel="noopener noreferrer">
                  {props.courseData.data.github}
                </a>{' '}
                <Link to={`/labtool/courseregistration/${props.selectedInstance.ohid}`}>
                  <Button circular floated="right" size="large" icon={{ name: 'edit', color: 'orange', size: 'large' }} />
                </Link>
              </h3>
            </Card.Content>
          </Card>
        ) : (
          <div />
        )}
      </div>
    )

    // student's week and code reviews
    if (props.selectedInstance && props.courseData && props.courseData.data && props.courseData.data.weeks) {
      let i = 0
      let week = null
      const weekMatcher = i => week => week.weekNumber === i + 1

      const howManyWeeks = props.selectedInstance.finalReview ? props.selectedInstance.weekAmount + 1 : props.selectedInstance.weekAmount
      for (; i < howManyWeeks; i++) {
        week = props.courseData.data.weeks.find(weekMatcher(i))
        headers.push(week !== undefined ? createStudentGradedWeek(i, week) : createStudentUngradedWeek(i))
      }

      props.courseData.data.codeReviews
        .sort((a, b) => {
          return a.reviewNumber - b.reviewNumber
        })
        .forEach(cr => {
          headers.push(createStudentCodeReview(i, cr))
          i++
        })

      headers.push(
        <Accordion key="total" fluid styled style={{ marginBottom: '2em' }}>
          <Accordion.Title active={true} index="total">
            <Icon name="check" />
            <strong> Total Points: </strong>
            {(
              props.courseData.data.weeks
                .map(week => week.points)
                .reduce((a, b) => {
                  return a + b
                }, 0) +
              props.courseData.data.codeReviews
                .map(cr => cr.points)
                .reduce((a, b) => {
                  return a + b
                }, 0)
            )
              .toFixed(2)
              .replace(/[.,]00$/, '')}
          </Accordion.Title>
        </Accordion>
      )
    }

    return headers
  }

  /**
   * Returns what teachers should see at the top of this page
   */
  let renderTeacherTopPart = () => {
    return (
      <div className="TeachersTopView" style={{ textAlignVertical: 'center', textAlign: 'center' }}>
        <CoursePageHeader courseInstance={props.selectedInstance} />
        {props.courseInstance &&
          props.courseInstance.active !== true &&
          (!props.selectedInstance.active && (
            <div>
              <Message compact>
                <Message.Header>You have not activated this course.</Message.Header>
              </Message>
              <br />
            </div>
          ))}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Cell>
                <div>
                  {props.selectedInstance.active === true ? (
                    <Label ribbon style={{ backgroundColor: '#21ba45' }}>
                      Active registration
                    </Label>
                  ) : (
                    <div />
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>Week amount: {props.selectedInstance.weekAmount}</Table.Cell>
              <Table.Cell>Current week: {props.selectedInstance.currentWeek}</Table.Cell>
              <Table.Cell>Week max points: {props.selectedInstance.weekMaxPoints}</Table.Cell>
              <Table.Cell textAlign="right">
                {' '}
                <Link to={`/labtool/ModifyCourseInstancePage/${props.selectedInstance.ohid}`}>
                  <Popup trigger={<Button circular size="tiny" icon={{ name: 'edit', size: 'large', color: 'orange' }} />} content="Edit course" />
                </Link>
              </Table.Cell>
            </Table.Row>
          </Table.Header>
        </Table>
      </div>
    )
  }

  let renderTeacherBottomPartForStudents = droppedOut => {
    const heading = droppedOut ? 'Dropped out students' : 'Students'
    const tableClassName = droppedOut ? 'TeachersBottomViewForDroppedOutStudents' : 'TeachersBottomViewForActiveStudents'
    const rowClassName = droppedOut ? 'TableRowForDroppedOutStudents' : 'TableRowForActiveStudents'
    const dropConvertButton = !droppedOut && droppedTagExists() && (
      <Button onClick={() => markAllWithDroppedTagAsDropped(props.courseData)} size="small">
        Mark all with dropped tag as dropped out
      </Button>
    )
    return (
      <div className={tableClassName}>
        <Header as="h2">{heading} </Header>

        <StudentTable
          rowClassName={rowClassName + (droppedOut ? ' active' : '')}
          columns={['select', 'points', 'review']}
          allowModify={true}
          selectedInstance={props.selectedInstance}
          studentInstances={props.courseData.data.filter(studentInstance => droppedOut === studentInstance.dropped)}
          coursePageLogic={props.coursePageLogic}
          tags={props.tags}
        />
        <br />
        {dropConvertButton}
        {!droppedOut && (
          <Link to={`/labtool/massemail/${props.selectedInstance.ohid}`}>
            <Button size="small">Send email to multiple students</Button>
          </Link>
        )}
      </div>
    )
  }

  /**
   * Function that returns what teachers should see at the bottom of this page
   */
  let renderTeacherBottomPartForActiveStudents = () => {
    return renderTeacherBottomPartForStudents(false)
  }

  let renderTeacherBottomPartForDroppedOutStudents = () => {
    if (droppedStudentExists()) {
      return renderTeacherBottomPartForStudents(true)
    }
  }

  const renderTeacherBulkForm = () => {
    // if any selected, even if outside filters
    const showMassAssign = Object.keys(props.coursePageLogic.selectedStudents).length

    return showMassAssign ? (
      <div className="TeacherBulkForm">
        <br />
        <h2>Modify selected students</h2>
        <Grid columns={3} divided style={{ width: '90%' }}>
          <Grid.Row>
            <Grid.Column>
              <Segment>Add/remove tag</Segment>
            </Grid.Column>
            <Grid.Column>
              <Dropdown id="tagDropdown" style={{ float: 'left' }} options={dropDownTags} onChange={changeSelectedTag()} placeholder="Choose tag" fluid selection />
            </Grid.Column>
            <Grid.Column>
              <div className="two ui buttons" style={{ float: 'left' }}>
                <button className="ui icon positive button" onClick={() => bulkAddTag()} size="mini">
                  <i className="plus icon" />
                </button>
                <div className="or" />
                <button className="ui icon button" onClick={() => bulkRemoveTag()} size="mini">
                  <i className="trash icon" />
                </button>
              </div>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Segment>Assign instructor</Segment>
            </Grid.Column>
            <Grid.Column>
              <Dropdown id="assistantDropdown" options={dropDownTeachers} onChange={changeSelectedTeacher()} placeholder="Select teacher" fluid selection />
            </Grid.Column>
            <Grid.Column>
              <Button onClick={() => bulkUpdateTeacher()} size="small">
                Change instructor
              </Button>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Segment>Dropped status</Segment>
            </Grid.Column>
            <Grid.Column>
              <Button onClick={() => bulkMarkNotDropped()}>Mark as non-dropped</Button>
            </Grid.Column>
            <Grid.Column>
              <Button color="red" onClick={() => bulkMarkDropped()}>
                Mark as dropped
              </Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <br />
      </div>
    ) : (
      <br />
    )
  }

  /**
   * Function that returns what students should see at the top of this page
   */
  let renderStudentTopPart = () => {
    return (
      <div className="StudentsView" style={{ textAlignVertical: 'center', textAlign: 'center' }}>
        <CoursePageHeader courseInstance={props.selectedInstance} />
        <div className="grid">
          {props.selectedInstance.active === true ? (
            props.courseData.data !== null ? (
              <p />
            ) : props.selectedInstance.registrationAtWebOodi === 'notfound' ? (
              <div className="sixteen wide column">
                <Message compact>
                  <Message.Header>No registration found at WebOodi.</Message.Header>
                  <p>If you have just registered, please try again in two hours.</p>
                </Message>
              </div>
            ) : (
              <div className="sixteen wide column">
                <Link to={`/labtool/courseregistration/${props.selectedInstance.ohid}`}>
                  {' '}
                  <Button color="blue" size="large">
                    Register
                  </Button>
                </Link>
              </div>
            )
          ) : (
            <div className="sixteen wide column">
              <Message compact>
                <Message.Header>This course has not been activated.</Message.Header>
              </Message>
            </div>
          )}
        </div>
      </div>
    )
  }

  /**
   * This part actually tells what to show to the user
   */
  if (props.courseData.role === 'student') {
    return (
      <div key>
        {renderStudentTopPart()}
        {renderStudentBottomPart()}
      </div>
    )
  } else if (props.courseData.role === 'teacher') {
    return (
      <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        {renderTeacherTopPart()}
        {renderTeacherBottomPartForActiveStudents()}
        {renderTeacherBottomPartForDroppedOutStudents()}
        {renderTeacherBulkForm()}
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </div>
    )
  } else {
    return <div />
  }
}

CoursePage.propTypes = {
  courseId: PropTypes.string.isRequired,

  user: PropTypes.object.isRequired,
  studentInstance: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  teacherInstance: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  selectedInstance: PropTypes.object.isRequired,
  courseInstance: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  courseData: PropTypes.object.isRequired,
  coursePageLogic: PropTypes.object.isRequired,
  tags: PropTypes.object.isRequired,
  loading: PropTypes.object.isRequired,

  createOneComment: PropTypes.func.isRequired,
  getOneCI: PropTypes.func.isRequired,
  coursePageInformation: PropTypes.func.isRequired,
  addLinkToCodeReview: PropTypes.func.isRequired,
  coursePageReset: PropTypes.func.isRequired,
  toggleCodeReview: PropTypes.func.isRequired,
  getAllTags: PropTypes.func.isRequired,
  tagStudent: PropTypes.func.isRequired,
  sendEmail: PropTypes.func.isRequired,
  updateActiveIndex: PropTypes.func.isRequired,
  unTagStudent: PropTypes.func.isRequired,
  resetLoading: PropTypes.func.isRequired,
  updateStudentProjectInfo: PropTypes.func.isRequired,
  associateTeacherToStudent: PropTypes.func.isRequired,
  selectTag: PropTypes.func.isRequired,
  selectTeacher: PropTypes.func.isRequired
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    studentInstance: state.studentInstance,
    teacherInstance: state.teacherInstance,
    selectedInstance: state.selectedInstance,
    courseInstance: state.courseInstance,
    courseData: state.coursePage,
    coursePageLogic: state.coursePageLogic,
    courseId: ownProps.courseId,
    tags: state.tags,
    loading: state.loading
  }
}

const mapDispatchToProps = {
  createOneComment,
  getOneCI,
  coursePageInformation,
  addLinkToCodeReview,
  coursePageReset,
  toggleCodeReview,
  getAllTags,
  tagStudent,
  sendEmail,
  updateActiveIndex,
  unTagStudent,
  resetLoading,
  updateStudentProjectInfo,
  associateTeacherToStudent,
  selectTag,
  selectTeacher
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CoursePage)
