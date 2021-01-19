
const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

const BASE_URL_B = "https://private-anon-c2a8bdb001-hackorsnoozev3.apiary-mock.com";

const BASE_URL_C = 'https://private-anon-c2a8bdb001-hackorsnoozev3.apiary-proxy.com';

////////////////////////////////////////////////////////////////////////----AXIOS WITH ERROR CATCHING
/**
 * try axios and catch error
 * display in console specific error and return
 * error in payload
 */
async function tryAxios(verb,url,params){
  let failed = false;
  let payload = await axios[verb](url, params).catch(err => {
    if(err.response){
      //console.log(`error response ${err.response.status}`);
    } else if(err.request){
      //console.log(`error request ${err.request.status}`);
    } else {
      //console.log(`unknown axios error`);
    }
    failed = true;
  });
  return {failed:failed,payload:payload};
}
////////////////////////////////////////////////////////////////////////----STORY CLASS
/**
 * story class for converting story objects
 * into a more readable form
 */
class Story {
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
  /**
   * could not get the update function to work 
   * after several hours, decided I'd come back
   * to it another day
   */
////////////////////////////////////////////////////////////////////////----STORY - UPDATE(DOESN'T WORK)  
//   async update(user, storyData){
//     let response = await tryAxios('patch',`${BASE_URL_C}/stories/${this.storyId}`,{
//       'token':user.loginToken,
//       'story':{
//         'title':storyData.title,
//         'author':storyData.author,
//         'url':storyData.url
//       }
//     });
//     if(response.failed){
//       return response.payload;
//     }
//     response = response.payload;
//     const { author, title, url, updatedAt } = response.data.story;
//     this.author = author;
//     this.title = title;
//     this.url = url;
//     this.updatedAt = updatedAt;
//     return this;
//   }
}
////////////////////////////////////////////////////////////////////////----STORYLIST CLASS
/**
 * StoryList class used to keep a list of stories
 * favorited or submitted by user
 */
class StoryList {
  constructor(stories) {
    this.stories = stories;
    this.selectedArticle = null;
  }
////////////////////////////////////////////////////////////////////////----STORYLIST - REMOVE STORY WITH ID
  removeStoryWithId(id){
    this.stories = this.stories.filter(story => story.storyId !== storyId);
  }
////////////////////////////////////////////////////////////////////////----STORYLIST - GET STORY WITH ID
  getStoryWithId(id){
    return this.stories.find(story => story.storyId == id);
  }
////////////////////////////////////////////////////////////////////////----STORYLIST - GET STORIES
  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios.get(`${BASE_URL}/stories`);
    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.data.stories.map(story => new Story(story));
    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories);
    return storyList;
  }
////////////////////////////////////////////////////////////////////////----STORYLIST - ADD STORY
/**
 * story data is retrieved and submitted to api
 * then is added to all stories and submitted
 * stories list
 */
  async addStory(user,newStory){
    let response = await tryAxios('post',`${BASE_URL}/stories`,{
      'token': user.loginToken,
      'story': {
        'author':newStory.author,
        'title':newStory.title,
        'url':newStory.url,
      } 
    });
    if(response.failed){
      return response.payload;
    }
    response = response.payload;
    let back = new Story(response.data.story);
    this.stories.unshift(back);
    user.ownStories.unshift(back);
    return back;
  }
////////////////////////////////////////////////////////////////////////----STORYLIST - REMOVE STORY
/**
 * remove story from site through api
 */
  async removeStory(user, storyId) {
    await tryAxios('delete',`${BASE_URL}/stories/${storyId}`,{
      data:{token:user.loginToken}
    });
    // filter out the story whose ID we are removing
    this.stories = this.stories.filter(story => story.storyId !== storyId);
    // do the same thing for the user's list of stories
    user.ownStories = user.ownStories.filter(s => s.storyId !== storyId
    );
  }  
}
////////////////////////////////////////////////////////////////////////----USER CLASS
/**
 * user class stores name/username/creation-update date
 * used to hold login information and allow for
 * favoriting and submitting articles
 */
class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;
    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }
////////////////////////////////////////////////////////////////////////----USER - REMOVE FAVORITE
  removeOwn(id){
    this.ownStories = this.ownStories.filter(s => s.id !== id);
  }
  async removeFavorite(id){
    await tryAxios('delete',`${BASE_URL}/users/${this.username}/favorites/${id}`,{
      data:{
        token:this.loginToken,
      }
    }); 
    await this.getInfo();
    return this;
  }  
////////////////////////////////////////////////////////////////////////----USER - ADD FAVORITE
  async addFavorite(id){
    await tryAxios('post',`${BASE_URL}/users/${this.username}/favorites/${id}`,{
        token:this.loginToken,
    });
    await this.getInfo();
    return this;
  }
////////////////////////////////////////////////////////////////////////----USER - GET USER INFO
/**
 * get user information to fill user
 */
  async getInfo(){
    let response = await tryAxios('get',`${BASE_URL}/users/${this.username}`, {
      params: {
        token: this.loginToken
      }
    });    
    if(response.failed === true){
      return;
    }
    response = response.payload;
    this.name = response.data.user.name;
    this.createdAt = response.data.user.createdAt;
    this.updatedAt = response.data.user.updatedAt;
    this.favorites = response.data.user.favorites.map(s => new Story(s));
    this.ownStories = response.data.user.stories.map(s => new Story(s));
    return this;
  }
////////////////////////////////////////////////////////////////////////----USER - CREATE NEW
  static async create(username, password, name) {
    let response = await tryAxios('post',`${BASE_URL}/signup`,{
      user: {
        username,
        password,
        name
      }
    });
    if(response.failed){
      return response.payload
    }
    response = response.payload;
    // build a new User instance from the API response
    const newUser = new User(response.data.user);
    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;
    return newUser;
  }
////////////////////////////////////////////////////////////////////////----USER - LOGIN
  static async login(username, password) {
    let response = await tryAxios('post',`${BASE_URL}/login`, 
      {
        'user':{
          username,
          password
        }
      }
    );
    if(response.failed){
      return response;
    }
    response = response.payload;
    // build a new User instance from the API response
    const existingUser = new User(response.data.user);
    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;
    return existingUser;
  }
////////////////////////////////////////////////////////////////////////----USER - AUTO-LOGIN
  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;
    let response = await tryAxios('get',`${BASE_URL}/users/${username}`,{
      params: {
        token
      }
    });
    if(response.failed){
      return response;
    }
    response = response.payload;
    // instantiate the user from the API information
    const existingUser = new User(response.data.user);
    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;
    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }
////////////////////////////////////////////////////////////////////////----USER - EDIT
  async edit(newName){
    let response = await tryAxios('patch',`${BASE_URL}/users/${this.username}`,{
      'token':this.loginToken,
      'user':{
        'name':newName,
      }
    });
    if(response.failed){
      console.log('error: ' + response.payload.message.status);
    }

  }
}

