import React, { Component } from "react";
import MessageList from "./MessageList.js";
import ChatBar from "./ChatBar.js";
import NavBar from "./NavBar.js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: "Michael", // optional. if currentUser is not defined, it means the user is Anonymous
      prevUser: "",
      messages: [],
      userCount: 0
    };
  }

  componentDidMount() {
    // console.log("componentDidMount <App />");
    this.ws = new WebSocket("wss://slackr-chat.herokuapp.com/");

    //when server broadcasts a message, take this message and update the App state and render the incoming message
    this.ws.onmessage = event => {
      const parsedData = JSON.parse(event.data);
      // console.log("parsedData:", parsedData);

      switch (parsedData.type) {
        case "userCount":
          this.setState({ userCount: parsedData.userCount });
          // console.log("this.state after userCount Message:", this.state);
          break;
        case "incomingMessage":
        case "incomingNotification":
        case "incomingImage":
          const updatedMessages = this.state.messages.concat(parsedData);
          this.setState({ messages: updatedMessages });
          // console.log("this.state after updatedMessages:", this.state);
          break;
      }
    };
  }

  render() {
    // console.log("Rendering <App />");
    return (
      <div>
        <NavBar userCount={this.state.userCount} />
        <MessageList allMessages={this.state.messages} />
        <ChatBar
          currentUser={this.state.currentUser}
          onSubmit={this.onSubmit}
          onNotification={this.onNotification}
        />
      </div>
    );
  }

  //when user hits "Enter", send message object (with item.type = postMessage) to server, server will then broadcast message to the right client (or all client)
  onSubmit = item => {
    const imageExtension = /(\.jpg|\.gif|\.jpeg|\.png)/;
    if (item.content.match(imageExtension)) {
      item.type = "postImage";
      console.log("found image");
      this.ws.send(JSON.stringify(item));
    } else {
      item.type = "postMessage";
      this.ws.send(JSON.stringify(item));
    }
  };

  //when user hits "Enter", send message object (with item.type = postNotification) to server, server will then broadcast message to the right client (or all client)
  onNotification = item => {
    item.type = "postNotification";
    this.setState({ currentUser: item.currentUser }); //set state of currentUser in App component so when it's passed back down to ChatBar, the updated user will be included
    this.ws.send(JSON.stringify(item));
  };
}

export default App;
