import React from 'react'
import { login } from '../../reducers/userReducer'
import { connect } from 'react-redux'
import { newNotification } from '../../reducers/notificationReducer'
class LoginPage extends React.Component {

  handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const content = {
        username: e.target.username.value,
        password: e.target.password.value
      }
      this.props.login(content)
      this.props.newNotification({ message: 'Teretulemasta', error: false })
    } catch (e) {
      this.props.newNotification({ message: 'VÄÄRÄ', error: true })

    }
    e.target.password.value = ''
  }
  render() {
    return (
      <div>
        <h2>Login</h2>
        <form onSubmit={this.handleSubmit}>
          <div><input name='username' /></div>
          <div><input type='password' name='password' /></div>
          <button>create</button>
        </form>
      </div>
    )
  }
}


export default connect(null, { login, newNotification })(LoginPage)