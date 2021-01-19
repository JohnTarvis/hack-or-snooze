$(async function() {
/////////////////////////////////////////////////////////////////////----ICONS
/**
 * buttons for editing / favoriting / deleting articles
 */
  const starIcon = '&#9734';
  const filledStarIcon = '&#9733';
  const trashcanIcon = '&#128465';
  const pencilIcon = '&#9999';
/////////////////////////////////////////////////////////////////////----SELECTORS
  const $body = $('body');
  ///-article lists
  const $allStoriesList = $("#all-articles-list");
  const $filteredArticles = $("#filtered-articles");
  const $ownStories = $("#my-articles");
  const $favoritedArticles = $("#favorited-articles");
  ///-forms
  const $submitForm = $("#submit-form");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $editArticleForm = $("#edit-article-form");
  ///-nav links
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navSubmitStory = $("#nav-submit-story");
  const $navFavorites = $("#nav-favorites");
  const $navMyStories = $("#nav-my-stories"); 
  const $navWelcome = $('#nav-welcome');
  ///-user profile
  const $profileName = $('#profile-name');
  const $profileUserName = $('#profile-username');
  const $userProfile = $("#user-profile");
  $userProfile.hide();
  ///-login form
  const $loginUsername = $('#login-username');
  const $loginPassword = $('#login-password');
  ///-create account form
  const $createAccountName = $('#create-account-name');
  const $createAccountUsername = $('#create-account-username');
  const $createAccountPassword = $('#create-account-password');
  ///-edit account form
  const $profileNameEdit = $('#profile-name-edit');
  const $profileUsernameEdit = $('#profile-username-edit');
  const $profileAccountDate = $('#profile-account-date');
  ///-story submission fields
  const $articleSubmissionAuthor = $('#article-submission-author');
  const $articleSubmissionTitle = $('#article-submission-title');
  const $articleSubmissionUrl = $('#article-submission-url');
  ///-buttons
  const $submitArticleButton = $('#submit-article-button');
  const $editArticleButton = $('#edit-article-button');
  const $deleteProfileButton = $('#delete-profile-button');
  const $editProfileButton = $('#edit-profile-button');
///////////////////////////////////////////////////////////////////////----GLOBAL INSTANCES 
/**
 * create an instance of storylist and user class 
 * check if there is login info in local storage
 * if there is then log in the current user
 */ 
  let storyList = null;
  let currentUser = null;
  await checkIfLoggedIn();    
///////////////////////////////////////////////////////////////////////----DISPLAY LOGIN FORM / LOGOUT
  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });
  /**
   * if the login button is clicked
   * show login form
   */
  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });
///////////////////////////////////////////////////////////////////////----SUBMIT LOGIN
/**
 * after user enters and submits login information
 * an instance of the userclass is created with
 * its static login method 
 * 
 * this is assigned to the currentUser variable
 * which will be used from here on
 */
  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit
    // grab the username and password
    const username = $loginUsername.val();
    const password = $loginPassword.val();
    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // if(userInstance === 'no such user'){
    //   $('#login-button').after("<div class='error-message'>incorrect username or password</div>");
    //   return;
    // }
    if(userInstance.failed){
      alert('user not found');
      return;
    }
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });
////////////////////////////////////////////////////////////////////////----CHECK LOCAL STORAGE FOR LOGIN INFO
/**
 * check local storage for login info
 * if it exists then login and show 
 * the nav bar for the current user
 */
  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();
    if (currentUser) {
      showNavForLoggedInUser();
      populateUserProfile();
    } else {
      showNavForVisitor();
    }
  }
////////////////////////////////////////////////////////////////////////----SAVE LOGIN INFO TO LOCAL STORAGE
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }   
////////////////////////////////////////////////////////////////////////----CLEAR INFO FROM LOCAL STORAGE
  function clearUserFromLocalStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }     
////////////////////////////////////////////////////////////////////////----HIDE LOGIN FORM AND SHOW NAV
  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();
    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");
    // show the stories
    $allStoriesList.show();
    // update the navigation bar
    showNavForLoggedInUser();
  }
////////////////////////////////////////////////////////////////////////----SHOW LOGGED IN NAV BAR
  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navWelcome.html(`<a class="nav-link" href='#'>${currentUser.username}</a>`);
    $navWelcome.show();
    $navFavorites.show();
    $navSubmitStory.show();
    $navMyStories.show();    
  }
////////////////////////////////////////////////////////////////////////----SHOW VISITOR NAV BAR
/**
 * show this if the user hasn't logged in 
 * or they have logged out
 */
  function showNavForVisitor() {
    $navLogin.show();
    $navLogOut.hide();
    $navWelcome.hide();
    $navFavorites.hide();
    $navSubmitStory.hide();
    $navMyStories.hide();
  }  
////////////////////////////////////////////////////////////////////////----CREATE USER ACCOUNT
/**
 * get entered username/password/name
 * and create a new user
 * assign that value to currentUser variable
 */
  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh
    // grab the required fields
    let name = $createAccountName.val();
    let username = $createAccountUsername.val();
    let password = $createAccountPassword.val();
    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });
////////////////////////////////////////////////////////////////////////----DELETE USER ACCOUNT
  $deleteProfileButton.on('click',async function(){
    if (confirm("Do you want to delete your account?")) {
      const response = await axios({
        url: `${BASE_URL}/users/${currentUser.username}`,
        method: "DELETE",
        data: {
          token: currentUser.loginToken,
        }
      });
      clearUserFromLocalStorage();
      showNavForVisitor();
      onlyShow($allStoriesList);
    }
  });
////////////////////////////////////////////////////////////////////////----DISPLAY USER PROFILE
  $navWelcome.on('click',function(){
    populateUserProfile();
    onlyShow($userProfile);
  });
////////////////////////////////////////////////////////////////////////----EDIT USER
/**
 * edit name
 */
  $editProfileButton.on('click',async function(){
    const name = $profileNameEdit.val();
    await currentUser.edit(name);
    currentUser = await User.getLoggedInUser(currentUser.loginToken,currentUser.username);
    populateUserProfile();
    $deleteProfileButton.after('<div>changed profile name</div>');
  });
////////////////////////////////////////////////////////////////////////----POPULATE USER PROFILE
/**
 * display username/name/account creation date
 * allow user to edit name
 */
  function populateUserProfile(){
    $profileNameEdit.val(currentUser.name);
    $profileUsernameEdit.empty().append(currentUser.username);
    $profileAccountDate.html(
      `created at: <div id="time-block">${currentUser.createdAt}</div>`
    );
  } 
///////////////////////////////////////////////////////////////////////----DISPLAY FAVORITES
  $navFavorites.on('click',async function(){
    await generateFavoriteStories();
    onlyShow($favoritedArticles);
  });
///////////////////////////////////////////////////////////////////////----DISPLAY SUBMITTED ARTICLES
  $navMyStories.on('click',async function(){
    await generateSubmittedStories();
    onlyShow($ownStories);
  });
///////////////////////////////////////////////////////////////////////----DISPLAY ALL STORIES
  $body.on("click", "#nav-all", async function() {
    await generateStories();
    onlyShow($allStoriesList);
  });
///////////////////////////////////////////////////////////////////////----DISPLAY STORY SUBMISSION FORM
  $navSubmitStory.on('click',function(){
    onlyShow($submitForm);
  });  
///////////////////////////////////////////////////////////////////////----SUBMIT ARTICLE
/**
 * submit entered article author/title/url
 * add to storyList via static addStory method
 * get all stories with new story added
 * and display them
 */
  $submitArticleButton.on('click',async function(){
    const submission = {
      author:$articleSubmissionAuthor.val(),
      title:$articleSubmissionTitle.val(),
      url:$articleSubmissionUrl.val(),
    };
    await storyList.addStory(currentUser,submission);
    await generateStories(); 
    onlyShow($allStoriesList);
  });  
///////////////////////////////////////////////////////////////////////----REMOVE SUBMITTED ARTICLE
/**
 * on submitted articles list
 * when user clicks one of the articles
 * check to see if the user has clicked 
 * the trashcan icon - story id is placed
 * in the id of the parent element
 * 
 * if the trashcan icon is clicked 
 * remove the story from the stories 
 * listed on the website through the api
 * 
 * remove the story from storyList variable
 */
  $ownStories.on('click',async function(e){
    const target = e.target || e.srcElement;
    const targetClassList = e.target.classList;
    const $parentElement = $(target.parentElement);
    const storyId = target.parentElement.id;
    if(targetClassList.contains('trashcan')){
      await storyList.removeStory(currentUser,storyId);
      $parentElement.remove();
    } 
    // else if(targetClassList.contains('pencil')){
    //   storyList.selectedArticle = storyId;
    //   onlyShow($editArticleForm);
    // } (edit article doesn't work)
  });
///////////////////////////////////////////////////////////////////////----TOGGLE FAVORITE ARTICLE
/**
 * when user clicks on all stories list
 * check to see if user has clicked on a star
 * if 'favorite' is not in its classlist
 * add it and replace empty star with filled star
 * and vice-versa
 */
  $allStoriesList.on('click',function(e){
    const target = e.target || e.srcElement;
    let targetClassList = e.target.classList;
    if(targetClassList.contains('star')){
      const storyId = target.parentElement.id;
      const storyClassList = target.parentElement.classList;
      if(!targetClassList.contains('favorite')){
        target.innerHTML = filledStarIcon;
        targetClassList.add('favorite');
        currentUser.addFavorite(storyId);
      }else{
        target.innerHTML = starIcon;
        targetClassList.remove('favorite');
        currentUser.removeFavorite(storyId);
      }
    }
  });
///////////////////////////////////////////////////////////////////////----REMOVE FROM FAVORITES
/**
 * if user clicks on favorited articles
 * if clicked target is a trashcan
 * remove the article from users list of favorites
 * stored on the site
 */
  $favoritedArticles.on('click',async function(e){
    const target = e.target || e.srcElement;
    const targetClassList = e.target.classList;
    const $parentElement = $(target.parentElement);
    if(targetClassList.contains('trashcan')){
      const storyId = target.parentElement.id;
      await currentUser.removeFavorite(storyId);
      $parentElement.remove();
    }
  });
///////////////////////////////////////////////////////////////////////----EDIT SUBMITTED ARTICLE(DOESN'T WORK)
  // $editArticleButton.on('click',async function(){
  //   const author = $('#edit-author').text();
  //   const url = $('#edit-url').text();
  //   const title = $('#edit-title').text();
  //   console.log('selected article',storyList.selectedArticle);
  //   await storyList.selectedArticle.update(currentUser,{
  //     'author':author,
  //     'url':url,
  //     'title':title,
  //   });
  //   onlyShow($allStoriesList);
  // });
////////////////////////////////////////////////////////////////////////----FILL NEW ARTICLES LIST
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();
    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story, 'new');
      $allStoriesList.append(result);
    }
  }
////////////////////////////////////////////////////////////////////////----FILL FAVORITES LIST
  async function generateFavoriteStories() {
    await currentUser.getInfo();
    // empty out the list by default
    $favoritedArticles.empty();
    // if the user has no favorites
    if (currentUser.favorites.length === 0) {
      $favoritedArticles.append("<h5>No favorites added!</h5>");
    } else {
      // for all of the user's favorites
      for (let story of currentUser.favorites) {
        // render each story in the list
        let favoriteHTML = generateStoryHTML(story, 'favorite');
        $favoritedArticles.append(favoriteHTML);
      }
    }
  }
////////////////////////////////////////////////////////////////////////----FILL SUBMITTED LIST
  async function generateSubmittedStories() {
    await currentUser.getInfo();
    // empty out the list by default
    $ownStories.empty();
    // if the user has no favorites
    if (currentUser.ownStories.length === 0) {
      $ownStories.append("<h5>You haven't submitted anything</h5>");
    } else {
      // for all of the user's favorites
      for (let story of currentUser.ownStories) {
        // render each story in the list
        let submittedHTML = generateStoryHTML(story, 'submitted');
        $ownStories.append(submittedHTML);
      }
    }
  }
////////////////////////////////////////////////////////////////////////----CREATE MARKUP FOR STORY OF TYPE
/**
 * generate html for stories based on type - all/favorite/submitted
 */
  function generateStoryHTML(story, type) {
    const hostName = getHostName(story.url);
    let topMarkup = '';
    if(type === "new"){
      topMarkup =`<li id="${story.storyId}" class="new-article">
      <span class="star">${starIcon}</span>`;
    }
    if(type === "favorite"){
      topMarkup =`<li id="${story.storyId}" class="favorite">
      <span class="trashcan">${trashcanIcon}</span>`;      
    }
    if(type === "submitted"){
      topMarkup =`<li id="${story.storyId}" class="submitted">
      <span class="trashcan">${trashcanIcon}</span>`
      //<span class="pencil">${pencilIcon}</span>`;     
    }
    const bottomMarkup = `
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `;
    const storyMarkup = topMarkup + bottomMarkup;
    return storyMarkup;
  }
////////////////////////////////////////////////////////////////////////----REPLACE UI COMPONENTS
/**
 * hide all elements and only show the
 * specified element
 */
  function onlyShow($element){
    hideElements();
    $element.show();
  }
  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $userProfile,
      $favoritedArticles,
      $editArticleForm,
    ];
    elementsArr.forEach($elem => $elem.hide());
  }
////////////////////////////////////////////////////////////////////////----RETURN HOST NAME FROM URL
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }
});

