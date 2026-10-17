const express = require("express");
const PushSubscription=require("../models/pushSubscriptionModel");
const User = require("../models/userModels");

const ggetPublicKey=(req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(500).json({
      success: false,
      message: "VAPID public key is not configured",
    });
  }

  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY,
  });
}
const enableNotification=async (req, res) => {
    try {
      const subscription = req.body;
      if (
        !subscription?.endpoint ||
        !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid push subscription",
        });
      }

      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          $set: {
            user: req.user._id,
            endpoint: subscription.endpoint,
            subscription,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      res.status(201).json({
        success: true,
        message: "Push notifications enabled",
      });
    } catch (error) {
      console.error("Subscribe error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to save device subscription",
      });
    }
  }
const removeNotification=async (req, res) => {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({
          success: false,
          message: "Endpoint is required",
        });
      }

      await PushSubscription.deleteOne({
        endpoint,
        user: req.user._id,
      });

      res.json({
        success: true,
        message: "Device subscription removed",
      });
    } catch (error) {
      console.error("Unsubscribe error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to remove subscription",
      });
    }
  }
module.exports={ggetPublicKey,enableNotification,removeNotification}