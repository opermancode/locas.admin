const handleLogin = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // THE SECURITY GATE: Only allow YOUR email
    if (user.email !== 'omkarjagtap@gmail.com') {
      await signOut(auth);
      Alert.alert("Access Denied", "You are not an authorized administrator of locas.");
      return;
    }

    // If it's you, proceed to the Dashboard
    navigation.navigate('Dashboard');
  } catch (error) {
    Alert.alert("Login Failed", error.message);
  }
};
