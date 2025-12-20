import { View, Text, FlatList, TouchableOpacity } from "react-native";
import React from "react";
import tw from "twrnc";

const NavFavorite = () => {
  const data = [
    {
      _id: "301",
      icon: "home",
      location: "Home",
      destination: "Mirpur 11, Dhaka, Bangladesh",
    },
    {
      _id: "302",
      icon: "briefcase",
      location: "Work",
      destination: "Mirpur 10, Dhaka, Bangladesh",
    },
  ];
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item?._id}
      ItemSeparatorComponent={() => (
        <View style={[tw`bg-gray-300`, { height: 1 }]} />
      )}
      renderItem={({ item }) => (
        <TouchableOpacity style={tw`flex-row items-center p-5`}>
          <View>
            <Text style={tw`font-semibold text-lg`}>{item?.location}</Text>
            <Text style={tw`text-gray-500`}>{item?.destination}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

export default NavFavorite;
