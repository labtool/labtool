import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import Courses from './components/pages/Courses'
import Login from './Login'
import { connect } from 'react-redux'
import { courseInstanceInitialization } from './reducers/courseInstanceReducer'
import LoginPage from './components/pages/LoginPage';


class App extends React.Component {

  componentDidMount() {
    this.props.courseInstanceInitialization()
  }

  render() {

    return (
      <div>
        {/* <Header /> */}
        <Main />
      </div>
    )
  }
}

const Main = () => {
  return (
    <main>
      <Switch>
        <Route exact path='/labtool' component={Login} />
        <Route path='/labtool/courses' component={Courses} />
        <Route path='/labtool/test' component={LoginPage} />
        {/* <Route path='/schedule' component={Schedule} /> */}
      </Switch>
    </main>
  )
}

export default connect(
  null,
  { courseInstanceInitialization }
)(App)
