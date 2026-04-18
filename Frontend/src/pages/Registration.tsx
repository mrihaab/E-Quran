import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Lock, Phone, Globe, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Input } from '../components/FormInput';
import { useAppDispatch } from '../store/hooks';
import { login } from '../store/authSlice';
import { apiRegister } from '../api';
import { useToast } from '../contexts/ToastContext';
import { UserRole } from '../types';
import { OTPVerificationModal } from '../components/OTPVerificationModal';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

const FormWrapper = ({ title, subtitle, children, onBack }: { title: string, subtitle: string, children: React.ReactNode, onBack: () => void }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6">
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-primary/10 p-4 sm:p-6 md:p-8 lg:p-12">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors mb-4 sm:mb-6 text-sm font-semibold">
        <ArrowLeft className="size-4" />
        Back
      </button>
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500 text-sm sm:text-base">{subtitle}</p>
      </div>
      {children}
    </div>
  </motion.div>
);

// Helper function for registration
async function handleRegisterSubmit(
  values: any,
  role: UserRole,
  dispatch: any,
  navigate: any,
  addToast: any,
  setSubmitting: (b: boolean) => void,
  setPendingVerification: (email: string | null) => void
) {
  try {
    const payload: any = {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      password: values.password,
      role,
      gender: values.gender,
      address: values.address,
    };

    // Add role-specific fields
    if (role === 'student') {
      payload.studentId = values.studentId;
      payload.dateOfBirth = values.dateOfBirth;
      payload.course = values.course;
      payload.enrollmentYear = values.enrollmentYear;
    } else if (role === 'teacher') {
      payload.teacherId = values.teacherId;
      payload.qualification = values.qualification;
      payload.subject = values.subject;
      payload.yearsOfExperience = values.yearsOfExperience;
      payload.salary = values.salary;
    } else if (role === 'parent') {
      payload.parentId = values.parentId;
      payload.childName = values.childName;
      payload.relationship = values.relationship;
      payload.childClass = values.childClass;
    } else if (role === 'admin') {
      payload.adminId = values.adminId;
      payload.rolePosition = values.rolePosition;
      payload.department = values.department;
      payload.accessLevel = values.accessLevel;
      payload.officeAddress = values.officeAddress;
    }

    const data = await apiRegister(payload);

    // Show OTP verification modal
    if (data.verificationRequired) {
      setPendingVerification(data.email);
      addToast('success', 'Registration Successful!', 'Please verify your email with the OTP sent.');
    }
  } catch (error: any) {
    addToast('error', 'Registration Failed', error.message || 'Please try again.');
  } finally {
    setSubmitting(false);
  }
}

export const RegisterStudent = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().required('Phone number is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
    studentId: Yup.string().required('Student ID is required'),
    dateOfBirth: Yup.date().required('Date of birth is required'),
    gender: Yup.string().required('Gender is required'),
    address: Yup.string().required('Address is required'),
    course: Yup.string().required('Course/Program is required'),
    enrollmentYear: Yup.number().required('Enrollment year is required'),
  });

  const formContent = (
    <>
      <Formik
        initialValues={{
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          studentId: '',
          dateOfBirth: '',
          gender: '',
          address: '',
          course: '',
          enrollmentYear: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          handleRegisterSubmit(values, 'student', dispatch, navigate, addToast, setSubmitting, setPendingVerification);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="fullName" label="Full Name" placeholder="John Doe" />
              <Input name="email" label="Email Address" type="email" placeholder="john@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="phone" label="Phone Number" placeholder="+1 234 567 890" />
              <Input name="studentId" label="Student ID" placeholder="STU12345" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="dateOfBirth" label="Date of Birth" type="date" />
              <Input
                name="gender"
                label="Gender"
                as="select"
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
            <Input name="address" label="Address" placeholder="123 Main St, City, Country" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="course" label="Course / Program" placeholder="Quranic Studies" />
              <Input name="enrollmentYear" label="Enrollment Year" type="number" placeholder="2023" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="password" label="Password" type="password" placeholder="••••••••" />
              <Input name="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" />
            </div>
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group mt-6 sm:mt-8 text-sm sm:text-base"
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
              {!isSubmitting && <ArrowRight className="group-hover:translate-x-1 transition-transform size-4 sm:size-5" />}
              {isSubmitting && <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"></div>}
            </button>
          </Form>
        )}
      </Formik>

      {/* Google Sign Up - Outside Form */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with</span>
        </div>
      </div>
      <GoogleLoginButton role="student" />

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={!!pendingVerification}
        onClose={() => setPendingVerification(null)}
        email={pendingVerification || ''}
        onVerified={(data) => {
          console.log('[REGISTER DEBUG] Student onVerified - data:', data);
          console.log('[REGISTER DEBUG] Student onVerified - data.user.role:', data.user?.role);
          dispatch(login({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role as UserRole,
            token: data.accessToken,
            profileImage: data.user.profileImage,
          }));
          addToast('success', 'Welcome!', 'Your account has been verified.');
          console.log('[REGISTER DEBUG] Student navigating to /student-dashboard');
          navigate('/student-dashboard');
        }}
      />
    </>
  );

  if (isEmbedded) {
    return formContent;
  }

  return (
    <FormWrapper 
      title="Student Registration" 
      subtitle="Join our community and start your Quranic journey today."
      onBack={() => navigate('/role-selection')}
    >
      {formContent}
    </FormWrapper>
  );
};

export const RegisterTeacher = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().required('Phone number is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
    teacherId: Yup.string().required('Teacher ID is required'),
    gender: Yup.string().required('Gender is required'),
    qualification: Yup.string().required('Qualification is required'),
    subject: Yup.string().required('Subject is required'),
    yearsOfExperience: Yup.number().min(0, 'Must be positive').required('Years of experience is required'),
    salary: Yup.number().min(0, 'Must be positive'),
    address: Yup.string().required('Address is required'),
  });

  const formContent = (
    <>
      <Formik
        initialValues={{
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          teacherId: '',
          gender: '',
          qualification: '',
          subject: '',
          yearsOfExperience: '',
          salary: '',
          address: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          handleRegisterSubmit(values, 'teacher', dispatch, navigate, addToast, setSubmitting, setPendingVerification);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="fullName" label="Full Name" placeholder="Sheikh Abdullah" />
              <Input name="email" label="Email Address" type="email" placeholder="abdullah@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="phone" label="Phone Number" placeholder="+1 234 567 890" />
              <Input name="teacherId" label="Teacher ID" placeholder="TEA12345" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                name="gender"
                label="Gender"
                as="select"
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
              />
              <div></div>
            </div>
            <Input name="qualification" label="Qualification" as="textarea" placeholder="List your certifications and experience..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                name="subject"
                label="Subject تخصص"
                as="select"
                options={[
                  { value: 'tajweed', label: "Tajweed & Qira'at" },
                  { value: 'hifz', label: 'Hifz (Memorization)' },
                  { value: 'arabic', label: 'Arabic Language' },
                  { value: 'islamic', label: 'Islamic Studies' },
                ]}
              />
              <Input name="yearsOfExperience" label="Years of Experience" type="number" placeholder="5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="salary" label="Salary (optional)" type="number" placeholder="50000" />
              <div></div>
            </div>
            <Input name="address" label="Address" placeholder="123 Main St, City, Country" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="password" label="Password" type="password" placeholder="••••••••" />
              <Input name="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" />
            </div>
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group mt-6 sm:mt-8 text-sm sm:text-base"
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
              {!isSubmitting && <ArrowRight className="group-hover:translate-x-1 transition-transform size-4 sm:size-5" />}
              {isSubmitting && <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"></div>}
            </button>
          </Form>
        )}
      </Formik>

      {/* Google Sign Up - Outside Form */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with</span>
        </div>
      </div>
      <GoogleLoginButton role="teacher" />

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={!!pendingVerification}
        onClose={() => setPendingVerification(null)}
        email={pendingVerification || ''}
        onVerified={(data) => {
          dispatch(login({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role as UserRole,
            token: data.accessToken,
            profileImage: data.user.profileImage,
          }));
          addToast('success', 'Welcome!', 'Your account has been verified.');
          navigate('/teacher-dashboard');
        }}
      />
    </>
  );

  if (isEmbedded) {
    return formContent;
  }

  return (
    <FormWrapper 
      title="Teacher Registration" 
      subtitle="Share your knowledge and inspire the next generation of scholars."
      onBack={() => navigate('/role-selection')}
    >
      {formContent}
    </FormWrapper>
  );
};

export const RegisterParent = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().required('Phone number is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
    parentId: Yup.string().required('Parent ID is required'),
    childName: Yup.string().required('Child name is required'),
    relationship: Yup.string().required('Relationship is required'),
    childClass: Yup.string().required('Child class is required'),
    address: Yup.string().required('Address is required'),
  });

  const formContent = (
    <>
      <Formik
        initialValues={{
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          parentId: '',
          childName: '',
          relationship: '',
          childClass: '',
          address: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          handleRegisterSubmit(values, 'parent', dispatch, navigate, addToast, setSubmitting, setPendingVerification);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="fullName" label="Full Name" placeholder="Parent Name" />
              <Input name="email" label="Email Address" type="email" placeholder="parent@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="phone" label="Phone Number" placeholder="+1 234 567 890" />
              <Input name="parentId" label="Parent ID" placeholder="PAR12345" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="childName" label="Child Name" placeholder="Child's Full Name" />
              <Input
                name="relationship"
                label="Relationship"
                as="select"
                options={[
                  { value: 'father', label: 'Father' },
                  { value: 'mother', label: 'Mother' },
                  { value: 'guardian', label: 'Guardian' },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="childClass" label="Child Class" placeholder="Grade 5" />
              <div></div>
            </div>
            <Input name="address" label="Address" placeholder="123 Main St, City, Country" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="password" label="Password" type="password" placeholder="••••••••" />
              <Input name="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" />
            </div>
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group mt-6 sm:mt-8 text-sm sm:text-base"
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
              {!isSubmitting && <ArrowRight className="group-hover:translate-x-1 transition-transform size-4 sm:size-5" />}
              {isSubmitting && <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"></div>}
            </button>
          </Form>
        )}
      </Formik>

      {/* Google Sign Up - Outside Form */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with</span>
        </div>
      </div>
      <GoogleLoginButton role="parent" />

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={!!pendingVerification}
        onClose={() => setPendingVerification(null)}
        email={pendingVerification || ''}
        onVerified={(data) => {
          dispatch(login({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role as UserRole,
            token: data.accessToken,
            profileImage: data.user.profileImage,
          }));
          addToast('success', 'Welcome!', 'Your account has been verified.');
          navigate('/parent-dashboard');
        }}
      />
    </>
  );

  if (isEmbedded) {
    return formContent;
  }

  return (
    <FormWrapper 
      title="Parent Registration" 
      subtitle="Manage your children's education and track their spiritual growth."
      onBack={() => navigate('/role-selection')}
    >
      {formContent}
    </FormWrapper>
  );
};

export const RegisterAdmin = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().required('Phone number is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
    adminId: Yup.string().required('Admin ID is required'),
    rolePosition: Yup.string().required('Role/Position is required'),
    department: Yup.string().required('Department is required'),
    accessLevel: Yup.string().required('Access level is required'),
    officeAddress: Yup.string().required('Office address is required'),
  });

  const formContent = (
    <>
      <Formik
        initialValues={{
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          adminId: '',
          rolePosition: '',
          department: '',
          accessLevel: '',
          officeAddress: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          handleRegisterSubmit(values, 'admin', dispatch, navigate, addToast, setSubmitting, setPendingVerification);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="fullName" label="Full Name" placeholder="Admin Name" />
              <Input name="email" label="Email Address" type="email" placeholder="admin@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="phone" label="Phone Number" placeholder="+1 234 567 890" />
              <Input name="adminId" label="Admin ID" placeholder="ADM12345" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="rolePosition" label="Role/Position" placeholder="Super Admin" />
              <Input name="department" label="Department" placeholder="IT" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                name="accessLevel"
                label="Access Level"
                as="select"
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'full', label: 'Full' },
                ]}
              />
              <div></div>
            </div>
            <Input name="officeAddress" label="Office Address" placeholder="123 Office St, City, Country" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input name="password" label="Password" type="password" placeholder="••••••••" />
              <Input name="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" />
            </div>
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group mt-6 sm:mt-8 text-sm sm:text-base"
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
              {!isSubmitting && <ArrowRight className="group-hover:translate-x-1 transition-transform size-4 sm:size-5" />}
              {isSubmitting && <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"></div>}
            </button>
          </Form>
        )}
      </Formik>

      {/* Google Sign Up - Outside Form */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with</span>
        </div>
      </div>
      <GoogleLoginButton role="admin" />

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={!!pendingVerification}
        onClose={() => setPendingVerification(null)}
        email={pendingVerification || ''}
        onVerified={(data) => {
          dispatch(login({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role as UserRole,
            token: data.accessToken,
            profileImage: data.user.profileImage,
          }));
          addToast('success', 'Welcome!', 'Your account has been verified.');
          navigate('/admin-dashboard');
        }}
      />
    </>
  );

  if (isEmbedded) {
    return formContent;
  }

  return (
    <FormWrapper 
      title="Admin Registration" 
      subtitle="Manage the platform and oversee operations."
      onBack={() => navigate('/role-selection')}
    >
      {formContent}
    </FormWrapper>
  );
};
