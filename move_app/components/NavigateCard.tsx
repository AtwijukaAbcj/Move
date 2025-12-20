import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import Container from "./Container";
import Title from "./Title";
import tw from "twrnc";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_API_KEY } from "@/config";
import { StyleSheet } from "react-native";
import { useDispatch } from "react-redux";
import { setDestination } from "@/store/uberSlices";
import NavFavorite from "./NavFavorite";
import { TabBarIcon } from "./navigation/TabBarIcon";
import RiderCard from "./RiderCard";

const NavigateCard = () => {
  const [showRider, setShowRider] = useState(false);
  const dispatch = useDispatch();
  return (
    <Container className="">
      {showRider ? (
        <RiderCard setShowRider={setShowRider} />
      ) : (
        <>
          <Title className="text-xl text-center">Hello, Noor</Title>
          <View>
            <GooglePlacesAutocomplete
              styles={inputBoxStyles}
              placeholder="where From?"
              nearbyPlacesAPI="GooglePlacesSearch"
              debounce={400}
              query={{
                key: GOOGLE_API_KEY,
                language: "en",
              }}
              fetchDetails={true}
              minLength={2}
              enablePoweredByContainer={false}
              onPress={(data, details = null) => {
                dispatch(
                  setDestination({
                    location: details?.geometry?.location,
                    description: data?.description,
                  })
                );
                setShowRider(true);
              }}
            />
            <NavFavorite />
            <View
              style={tw`flex-row bg-white justify-evenly py-2 mt-auto border-t border-t-gray-200`}
            >
              <TouchableOpacity
                onPress={() => setShowRider(true)}
                style={tw`flex-row items-center justify-between bg-black w-24 px-4 py-3 rounded-full`}
              >
                <TabBarIcon name="car" color={"white"} size={20} />
                <Text style={tw`text-white`}>Rides</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex flex-row items-center justify-between w-24 px-4 py-3 rounded-full border border-gray-300`}
              >
                <TabBarIcon name="fast-food-outline" color="black" size={20} />

                <Text style={tw`text-center ml-1`}>Eats</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </Container>
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
export default NavigateCard;
