import React, { useState, useEffect } from 'react';
import {
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Grow,
  TextField as Input,
  Typography,
} from '@mui/material';
import classnames from 'classnames';
import { useLocation, useNavigate } from 'react-router-dom';

// styles
import useStyles from './styles';

// logo
import logo from './logo.svg';
import google from '../../images/google.svg';

// context
import {
  useUserDispatch,
  loginUser,
  registerUser,
  sendPasswordResetEmail, useUserState,
} from '../../context/UserContext';
import { receiveToken, doInit } from '../../context/UserContext';

//components
import { Button } from '../../components/Wrappers';
import Widget from '../../components/Widget';
import config from '../../config';

const getGreeting = () => {
  const d = new Date();
  if (d.getHours() >= 4 && d.getHours() <= 12) {
    return 'Доброе утро';
  } else if (d.getHours() >= 13 && d.getHours() <= 16) {
    return 'Добрый день ';
  } else if (d.getHours() >= 17 && d.getHours() <= 23) {
    return 'Доброго вечера';
  } else {
    return 'Доброй ночи';
  }
};

function Login() {
  let classes = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const tab = new URLSearchParams(location.search).get('tab');

  // global
  let userDispatch = useUserDispatch();
  let userState = useUserState(); // <-- Добавьте получение состояния

  useEffect(() => {
    console.log('🔍 Login компонент: состояние изменилось', {
      isAuthenticated: userState?.isAuthenticated,
      currentUser: userState?.currentUser,
    });

    // Если пользователь авторизован и есть данные - перенаправляем
    if (userState?.isAuthenticated && userState?.currentUser) {
      console.log('✅ Пользователь авторизован, перенаправляем на /dashboard');
      navigate('/dashboard', { replace: true });
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      receiveToken(token, userDispatch);
      doInit()(userDispatch);
    }
  }, [userState?.isAuthenticated, userState?.currentUser, navigate]);

  // local
  let [isLoading, setIsLoading] = useState(false);
  let [error, setError] = useState(null);
  const parsedTab = Number(tab);
  let [activeTabId, setActiveTabId] = useState(Number.isFinite(parsedTab) ? parsedTab : 0);
  let [nameValue, setNameValue] = useState('');
  let [loginValue, setLoginValue] = useState('test@example.com');
  let [passwordValue, setPasswordValue] = useState('password');
  let [forgotEmail, setForgotEmail] = useState('');
  let [isForgot, setIsForgot] = useState(false);

  let isLoginFormValid = () => {
    return loginValue.length !== 0 && passwordValue.length !== 0;
  };

  let loginOnEnterKey = (event) => {
    if (event.key === 'Enter' && isLoginFormValid()) {
      loginUser(
        userDispatch,
        loginValue,
        passwordValue,
        setIsLoading,
        setError,
      );
    }
  };

  return (
    <Grid container className={classes.container}>
      <div className={classes.logotypeContainer}>
        <img src={logo} alt='logo' className={classes.logotypeImage} />
        <Typography className={classes.logotypeText}>
          React Material Admin
        </Typography>
      </div>
      <div
        className={
          !isForgot ? classes.formContainer : classes.customFormContainer
        }
      >
        <div className={classes.form}>
          {isForgot ? (
            <div>
              <Input
                id='password'
                InputProps={{
                  classes: {
                    underline: classes.InputUnderline,
                    input: classes.Input,
                  },
                }}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                margin='normal'
                placeholder='Email'
                type='Email'
                fullWidth
              />
              <div className={classes.formButtons}>
                {isLoading ? (
                  <CircularProgress size={26} className={classes.loginLoader} />
                ) : (
                  <Button
                    disabled={forgotEmail.length === 0}
                    onClick={() =>
                      sendPasswordResetEmail(forgotEmail)(userDispatch)
                    }
                    variant='contained'
                    color='primary'
                    size='large'
                  >
                    Send
                  </Button>
                )}
                <Button
                  color='primary'
                  size='large'
                  onClick={() => setIsForgot(!isForgot)}
                  className={classes.forgetButton}
                >
                  Back to login
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Tabs
                value={activeTabId}
                onChange={(e, id) => setActiveTabId(id)}
                indicatorColor='primary'
                textColor='primary'
                centered
              >
                <Tab label='Логин' classes={{ root: classes.tab }} />
                <Tab label='Новый пользователь' classes={{ root: classes.tab }} />
              </Tabs>
              {activeTabId === 0 && (
                <React.Fragment>
                  {config.isBackend ? (
                    <Widget
                      disableWidgetMenu
                      inheritHeight
                      style={{ marginTop: 32 }}
                    >
                      <Typography
                        variant={'body2'}
                        component="div"
                        style={{ textAlign: 'center' }}
                      >
                        Работает backend - используй
                        <Typography variant={'body2'} weight={'bold'}>
                          "test@example.com / password"
                        </Typography>{' '}
                        для логина!
                      </Typography>
                    </Widget>
                  ) : null}
                  <Typography variant='h1' className={classes.greeting}>
                    {getGreeting()}, Пользователь
                  </Typography>
                  <Grow
                    in={error}
                    style={
                      !error ? { display: 'none' } : { display: 'inline-block' }
                    }
                  >
                    <Typography className={classes.errorMessage}>
                      Something is wrong with your login or password :(
                    </Typography>
                  </Grow>
                  <Input
                    id='email'
                    InputProps={{
                      classes: {
                        underline: classes.InputUnderline,
                        input: classes.Input,
                      },
                    }}
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    margin='normal'
                    placeholder='Email Adress'
                    type='email'
                    fullWidth
                    onKeyDown={(e) => loginOnEnterKey(e)}
                  />
                  <Input
                    id='password'
                    InputProps={{
                      classes: {
                        underline: classes.InputUnderline,
                        input: classes.Input,
                      },
                    }}
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    margin='normal'
                    placeholder='Password'
                    type='password'
                    fullWidth
                    onKeyDown={(e) => loginOnEnterKey(e)}
                  />
                  <div className={classes.formButtons}>
                    {isLoading ? (
                      <CircularProgress
                        size={26}
                        className={classes.loginLoader}
                      />
                    ) : (
                      <Button
                        disabled={!isLoginFormValid()}
                        onClick={() =>
                          loginUser(
                            userDispatch,
                            loginValue,
                            passwordValue,
                            setIsLoading,
                            setError,
                          )
                        }
                        variant='contained'
                        color='primary'
                        size='large'
                      >
                        Войти
                      </Button>
                    )}
                    <Button
                      color='primary'
                      size='large'
                      onClick={() => setIsForgot(!isForgot)}
                      className={classes.forgetButton}
                    >
                      Забыли пароль?
                    </Button>
                  </div>
                </React.Fragment>
              )}
              {activeTabId === 1 && (
                <React.Fragment>
                  <Typography variant='h1' className={classes.greeting}>
                    Приветствую!
                  </Typography>
                  <Typography variant='h2' className={classes.subGreeting}>
                    Создай новый аккаунт
                  </Typography>
                  <Grow in={error}>
                    <Typography className={classes.errorMessage}>
                      Что-то не так с логином и паролем :(
                    </Typography>
                  </Grow>
                  <Input
                    id='name'
                    InputProps={{
                      classes: {
                        underline: classes.InputUnderline,
                        input: classes.Input,
                      },
                    }}
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    margin='normal'
                    placeholder='Полное имя'
                    type='email'
                    fullWidth
                  />
                  <Input
                    id='email'
                    InputProps={{
                      classes: {
                        underline: classes.InputUnderline,
                        input: classes.Input,
                      },
                    }}
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    margin='normal'
                    placeholder='Email адрес'
                    type='email'
                    fullWidth
                  />
                  <Input
                    id='password'
                    InputProps={{
                      classes: {
                        underline: classes.InputUnderline,
                        input: classes.Input,
                      },
                    }}
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    margin='normal'
                    placeholder='Пароль'
                    type='password'
                    fullWidth
                  />
                  <div className={classes.creatingButtonContainer}>
                    {isLoading ? (
                      <CircularProgress size={26} />
                    ) : (
                      <Button
                        onClick={() =>
                          registerUser(
                            userDispatch,
                            nameValue,
                            loginValue,
                            passwordValue,
                            navigate,
                            setIsLoading,
                            setError,
                          )()
                        }
                        disabled={
                          loginValue.length === 0 ||
                          passwordValue.length === 0 ||
                          nameValue.length === 0
                        }
                        size='large'
                        variant='contained'
                        color='primary'
                        fullWidth
                        className={classes.createAccountButton}
                      >
                        Создать аккаунт
                      </Button>
                    )}
                  </div>
                </React.Fragment>
              )}
            </>
          )}
        </div>
        <Typography color='primary' className={classes.copyright}>
          {new Date().getFullYear()}{' '}
          <a
            style={{ textDecoration: 'none', color: 'inherit' }}
            href='https://lyutikoff.ru'
            rel='noopener noreferrer'
            target='_blank'
          >
            Luytikoff
          </a>
          , Все права защищены.
        </Typography>
      </div>
    </Grid>
  );
}

export default Login;
