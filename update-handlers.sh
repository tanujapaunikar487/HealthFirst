#!/bin/bash

# Update Doctor/ConfirmStep.tsx
sed -i '' 's/const handleBack = () => {/const { goBack } = useNavigation();\n\n  const handleBack = () => {/' resources/js/Pages/Booking/Doctor/ConfirmStep.tsx
sed -i '' "s|router.get('/booking/doctor/doctor-time');|goBack('/booking/doctor/doctor-time');|" resources/js/Pages/Booking/Doctor/ConfirmStep.tsx

# Update Lab/PatientStep.tsx
sed -i '' 's/const handleBack = () => {/const { goBack } = useNavigation();\n\n  const handleBack = () => {/' resources/js/Pages/Booking/Lab/PatientStep.tsx
sed -i '' "s|router.get('/booking');|goBack('/booking');|" resources/js/Pages/Booking/Lab/PatientStep.tsx

# Update Lab/TestSearchStep.tsx
sed -i '' 's/const handleBack = () => {/const { goBack } = useNavigation();\n\n  const handleBack = () => {/' resources/js/Pages/Booking/Lab/TestSearchStep.tsx
sed -i '' "s|router.get('/booking/lab/patient');|goBack('/booking/lab/patient');|" resources/js/Pages/Booking/Lab/TestSearchStep.tsx

# Update Lab/ScheduleStep.tsx
sed -i '' 's/const handleBack = () => {/const { goBack } = useNavigation();\n\n  const handleBack = () => {/' resources/js/Pages/Booking/Lab/ScheduleStep.tsx
sed -i '' "s|router.get('/booking/lab/test-search');|goBack('/booking/lab/test-search');|" resources/js/Pages/Booking/Lab/ScheduleStep.tsx

# Update Lab/ConfirmStep.tsx
sed -i '' 's/const handleBack = () => {/const { goBack } = useNavigation();\n\n  const handleBack = () => {/' resources/js/Pages/Booking/Lab/ConfirmStep.tsx
sed -i '' "s|router.get('/booking/lab/schedule');|goBack('/booking/lab/schedule');|" resources/js/Pages/Booking/Lab/ConfirmStep.tsx

echo "All handleBack functions updated!"
