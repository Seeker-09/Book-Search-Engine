const { User, Book } = require('../models')
const { signToken } = require('../utils/auth')
const { AuthenticationError } = require('apollo-server-express');
const { sign } = require('jsonwebtoken');

const resolvers = {
  Query: {
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select('-__v -password')
        .populate('savedBooks')
    }
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args)
      const token = signToken(user)

      return { token, user }
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email })

      if(!user) {
        throw new AuthenticationError('incorrect credentials')
      }

      const correctPw = await user.isCorrectPassword(password)

      if(!correctPw) {
        throw new AuthenticationError('incorrect credentials')
      }

      const token = signToken(user)
      return { token, user }
    },
    saveBook: async (parent, args, context) => {
      if(context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addtoSet: { savedBooks: args } },
          { new: true, runValidators: true }
        ).populate('savedBooks')

        return updatedUser
      }
    },
    deleteBook: async (parent, {bookId}, context) => {
      if(context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: bookId } },
          { new: true}
        ).populate('savedBooks')

        return updatedUser
      }
    }
  }
}

module.exports = resolvers