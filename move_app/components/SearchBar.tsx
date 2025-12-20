import { View, Text } from "react-native";
import React from "react";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_API_KEY } from "@/config";
import { StyleSheet } from "react-native";
import { useDispatch } from "react-redux";
import { setDestination, setOrigin } from "@/store/uberSlices";

const SearchBar = () => {
  const dispatch = useDispatch();
  const placesRef = React.useRef(null);
  if (!GOOGLE_API_KEY) return null;
  return (
    <View style={{ flex: 1 }}>
      <GooglePlacesAutocomplete
        ref={placesRef}
        placeholder="Search"
        fetchDetails={true}
        predefinedPlaces={[]}
        onPress={(data, details = null) => {
          if (!details) return;
          console.log('Selected place:', data, details);
          dispatch(
            setOrigin({
              location: details.geometry.location,
              description: data.description,
            })
          );
          dispatch(setDestination(null));
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: 'en',
        }}
        onFail={error => {
          console.log('Places API error:', error);
          alert('Google Places API error: ' + JSON.stringify(error));
        }}
        styles={inputBoxStyles}
      />
    </View>
  );
};

const inputBoxStyles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginTop: 10,
    flex: 0,
  },
  textInput: {
    fontSize: 18,
    backgroundColor: "#DDDDDD20",
    borderWidth: 1,
    borderColor: "#00000050",
    borderRadius: 50,
  },
  textInputContainer: {
    paddingBottom: 0,
  },
});

export default SearchBar;
